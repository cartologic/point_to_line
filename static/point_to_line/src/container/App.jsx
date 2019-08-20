import React, { Component } from 'react'
import MainPage from '../components/MainPage'
import { getCRSFToken, sortByFilter, groupByFilter } from '../utils'
import UrlAssembler from 'url-assembler'

export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            resourceSelectDialog: {
                open: false,
                resources: [],
            },
            publishForm: {
                selectedResource: undefined,
                attributes: [],
                sortByValue: '',
                groupByValue: '',
                outLayerName: '',
                errors: {},
            },
            resultsDialog: {
                open: false,
                errors: undefined,
                success: undefined,
                layerName: undefined
            }
        }
        // globalURLS are predefined in index.html otherwise use the following defaults
        this.urls = globalURLS
        this.fetchResources = this.fetchResources.bind(this)
        this.resourceSelectDialogClose = this.resourceSelectDialogClose.bind(this)
        this.resourceSelectDialogOpen = this.resourceSelectDialogOpen.bind(this)
        this.resultsDialogClose = this.resultsDialogClose.bind(this)
        this.resultsDialogOpen = this.resultsDialogOpen.bind(this)
        this.onResourceSelect = this.onResourceSelect.bind(this)
        this.getLayerAttributes = this.getLayerAttributes.bind(this)
        this.publishChange = this.publishChange.bind(this)
        this.apply = this.apply.bind(this)
    }
    resourceSelectDialogClose() {
        this.setState({
            resourceSelectDialog: {
                ...this.state.resourceSelectDialog,
                open: false
            }
        })
    }
    resourceSelectDialogOpen() {
        this.setState({
            resourceSelectDialog: {
                ...this.state.resourceSelectDialog,
                open: true
            }
        })
    }
    resultsDialogClose() {
        this.setState({
            resultsDialog: {
                ...this.state.resultsDialog,
                open: false
            }
        })
    }
    resultsDialogOpen() {
        this.setState({
            resultsDialog: {
                ...this.state.resultsDialog,
                open: true
            }
        })
    }
    fetchResources() {
        const params = {
            'geom_type': 'point',
        }
        const url = UrlAssembler(this.urls.layersAPI).query(params).toString()
        return fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                "X-CSRFToken": getCRSFToken(),
            }
        }).then((response) => {
            return response.json()
        })
            .then(data => {
                this.setState({
                    loading: false,
                    resourceSelectDialog: {
                        ...this.state.resourceSelectDialog,
                        resources: data.objects
                    }
                })
            })
    }
    componentDidMount() {
        this.setState(
            {
                loading: true
            },
            () => {
                this.fetchResources()
            }
        )
    }
    onResourceSelect(resource) {
        this.setState({
            publishForm: {
                ...this.state.publishForm,
                selectedResource: resource
            },
            resourceSelectDialog: {
                ...this.state.resourceSelectDialog,
                open: false
            },
            loading: true
        },
            () => {
                this.getLayerAttributes()
            }
        )
    }
    getLayerAttributes() {
        const layer = this.state.publishForm.selectedResource
        const params = {
            'layer__id': layer.id
        }
        const url = UrlAssembler(this.urls.attributesAPI).query(params).toString()
        return fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                "X-CSRFToken": getCRSFToken(),
            }
        }).then((response) => {
            return response.json()
        }).then(data => {
            this.setState({
                publishForm: {
                    ...this.state.publishForm,
                    attributes: data.objects,
                },
                loading: false
            })
        })
    }
    publishChange(e) {
        this.setState({
            publishForm: {
                ...this.state.publishForm,
                [e.target.name]: e.target.value,
            }
        })
    }
    validateFormData(form) {
        let emptyOrUndefined = (str) => {
            return str && str.length > 0
        }
        let validateTableName = (tableName) => {
            let re = /^[a-z0-9_]{1,63}$/
            return tableName && re.test(tableName)
        }
        let formErrors = undefined
        if (!emptyOrUndefined(form.inLayerName)) {
            formErrors = {
                ...formErrors,
                inLayerName: true
            }
        }
        if (!validateTableName(form.outLayerName)) {
            formErrors = {
                ...formErrors,
                outLayerName: true
            }
        }
        if (!emptyOrUndefined(form.sortByValue)) {
            formErrors = {
                ...formErrors,
                sortByValue: true
            }
        }
        if (!emptyOrUndefined(form.groupByValue)) {
            formErrors = {
                ...formErrors,
                groupByValue: true
            }
        }
        return formErrors
    }
    apply() {
        const handleFailure = (res) => {
            res.json().then(jsonResponse=>{
                this.setState({
                    loading: false,
                    resultsDialog: {
                        ...this.state.resultsDialog,
                        open: true,
                        errors: jsonResponse.message,
                        success: undefined,
                        layerName: undefined,
                    }
                })
            })
        }
        const handleSuccess = (res) => {
            res.json().then(jsonResponse=>{
                this.setState({
                    loading: false,
                    resultsDialog: {
                        ...this.state.resultsDialog,
                        open: true,
                        errors: undefined,
                        success: jsonResponse.message,
                        layerURL: this.urls.layerDetail(jsonResponse.layer_name),
                    }
                })
            })
        }
        const submit = ({
            inLayerName,
            outLayerName,
            sortByValue,
            groupByValue
        }) => {
            let form = new FormData();
            form.append('in_layer_name', inLayerName)
            form.append('sort_by_attr', sortByValue)
            form.append('group_by_attr', groupByValue)
            form.append('out_layer_name', outLayerName)
            form.append('csrfmiddlewaretoken', getCRSFToken())
            fetch(this.urls.generateLineLayer, {
                method: 'POST',
                body: form,
                credentials: 'same-origin',
            })
                .then(res => {
                    if (res.status == 500) {
                        handleFailure(res)
                    }
                    if (res.status == 200) {
                        handleSuccess(res)
                    }
                })
        }
        const {
            selectedResource,
            sortByValue,
            groupByValue,
            outLayerName,
        } = this.state.publishForm
        const inLayerName = selectedResource && selectedResource.name
        const errors = this.validateFormData({
            inLayerName,
            outLayerName,
            sortByValue,
            groupByValue
        })
        if (errors) {
            this.setState({
                publishForm: {
                    ...this.state.publishForm,
                    errors,
                }
            })
        } else {
            this.setState({
                publishForm: {
                    ...this.state.publishForm,
                    errors: {},
                }
            },
                () => {
                    submit({
                        inLayerName,
                        outLayerName,
                        sortByValue,
                        groupByValue
                    })
                }
            )
        }
    }
    render() {
        const props = {
            urls: this.urls,
            resourceSelectProps: {
                ...this.state.resourceSelectDialog,
                handleClose: this.resourceSelectDialogClose,
                onResourceSelect: this.onResourceSelect,
                selectedResource: this.state.publishForm.selectedResource,
            },
            publishForm: {
                ...this.state.publishForm,
                resourceSelectDialogOpen: this.resourceSelectDialogOpen,
                sortByChange: this.publishChange,
                sortByFilter,
                groupByChange: this.publishChange,
                groupByFilter,
                outLayerNameChange: this.publishChange,
                onApply: this.apply,
            },
            resultsDialog: {
                ...this.state.resultsDialog,
                handleClose: this.resultsDialogClose,
            }
        }
        return (
            <MainPage {...props} />
        )
    }
}