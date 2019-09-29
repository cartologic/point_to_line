import React, { Component } from 'react'
import MainPage from '../components/MainPage'
import { getCRSFToken, groupByFilter } from '../utils'
import UrlAssembler from 'url-assembler'
const sortByFilter = groupByFilter
export default class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            resourceSelectDialog: {
                open: false,
                resources: [],
                searchValue: '',
            },
            step0: {
                selectedResource: undefined,
                attributes: [],
                sortByValue: '',
                groupByValue: '',
                errors: {},
            },
            step1: {
                outLayers: [],
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
            },
            outLayersDialog: {
                open: false,
                outLayers: [],
                errors: undefined
            }
        }
        // globalURLS are predefined in index.html otherwise use the following defaults
        this.urls = globalURLS
        this.checkedLineFeatures = []
        this.fetchResources = this.fetchResources.bind(this)
        this.onSearchChange = this.onSearchChange.bind(this)
        this.resourceSelectDialogClose = this.resourceSelectDialogClose.bind(this)
        this.resourceSelectDialogOpen = this.resourceSelectDialogOpen.bind(this)
        this.resultsDialogClose = this.resultsDialogClose.bind(this)
        this.outLayersDialogClose = this.outLayersDialogClose.bind(this)
        this.resultsDialogOpen = this.resultsDialogOpen.bind(this)
        this.onResourceSelect = this.onResourceSelect.bind(this)
        this.validateSelectedResource = this.validateSelectedResource.bind(this)
        this.getLineFeatures = this.getLineFeatures.bind(this)
        this.getLayerAttributes = this.getLayerAttributes.bind(this)
        this.publishChange = this.publishChange.bind(this)
        this.onOutLayerCheck = this.onOutLayerCheck.bind(this)
        this.onOutLayerCheckAll = this.onOutLayerCheckAll.bind(this)
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
    outLayersDialogClose() {
        this.setState({
            outLayersDialog: {
                ...this.state.outLayersDialog,
                open: false
            }
        })
    }

    validateSelectedResource(valid){
        this.setState({
            step0:{
                ...this.state.step0,
                error: valid
            }
        })
    }

    async getLineFeatures(){
        this.setState({loading: true})
        const {
            groupByValue,
            sortByValue,
            selectedResource
        } = this.state.step0
        const inLayerName = selectedResource.name
        
        let form = new FormData();
        form.append('in_layer_name', inLayerName)
        if (sortByValue && sortByValue.length > 0)
            form.append('sort_by_attr', sortByValue)
        if (groupByValue && groupByValue.length > 0)
            form.append('group_by_attr', groupByValue)
        form.append('csrfmiddlewaretoken', getCRSFToken())
        const res = await fetch(this.urls.getLineFeatures, {
            method: 'POST',
            body: form,
            credentials: 'same-origin',
        })
        if (res.status == 200) {
            const data = await res.json()
            this.setState({
                loading: false,
                step1: {
                    ...this.state.step1,
                    outLayers: data.objects.map(l=>{return{...l, checked: false}}),
                }
            })

        }
        if (res.status == 500) {
            console.log(res.message)
        }
    }

    fetchResources() {
        const params = {
            'geom_type': 'point',
            'title__icontains': this.state.resourceSelectDialog.searchValue,
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
            step0: {
                ...this.state.step0,
                selectedResource: resource,
                error: false,
            },
            resourceSelectDialog: {
                ...this.state.resourceSelectDialog,
                open: false
            },
            step1:{
                ...this.state.step1,
                outLayers: [],
            },
            loading: true
        },
            () => {
                this.getLayerAttributes()
            }
        )
    }
    getLayerAttributes() {
        const layer = this.state.step0.selectedResource
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
                step0: {
                    ...this.state.step0,
                    attributes: data.objects,
                },
                loading: false
            })
        })
    }
    publishChange(e) {
        this.setState({
            step0: {
                ...this.state.step0,
                [e.target.name]: e.target.value,
            },
            step1: {
                ...this.state.step1,
                outLayers: []
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
        return formErrors
    }
    apply() {
        const handleFailure = (res) => {
            res.json().then(jsonResponse => {
                this.setState({
                    loading: false,
                    resultsDialog: {
                        ...this.state.resultsDialog,
                        open: true,
                        errors: jsonResponse.message,
                        success: undefined,
                    }
                })
            })
        }
        const handleSuccess = (res) => {
            res.json().then(jsonResponse => {
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
        const lineLayersSuccess = (res) => {
            res.json().then(jsonResponse => {
                this.setState({
                    loading: false,
                    outLayersDialog: {
                        ...this.state.outLayersDialog,
                        open: true,
                        errors: undefined,
                        success: jsonResponse.message,
                        outLayers: jsonResponse.objects.map(l=>{return{...l, checked: false}})
                    }
                })
            })
        }
        const lineLayersFailure = (res) => {
            res.json().then(jsonResponse => {
                this.setState({
                    loading: false,
                    outLayersDialog: {
                        ...this.state.outLayersDialog,
                        open: true,
                        errors: jsonResponse.message,
                        success: undefined,
                    }
                })
            })
        }
        const submit = ({
            inLayerName,
            outLayerName,
            sortByValue,
            groupByValue,
            checkedLineFeatures
        }) => {
            let form = new FormData();
            form.append('in_layer_name', inLayerName)
            if (sortByValue && sortByValue.length > 0)
                form.append('sort_by_attr', sortByValue)
            if (groupByValue && groupByValue.length > 0)
                form.append('group_by_attr', groupByValue)
            if (checkedLineFeatures && checkedLineFeatures.length > 0)
                form.append('line_features', JSON.stringify(checkedLineFeatures))
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
        const getLineFeatures = ({
            inLayerName,
            outLayerName,
            sortByValue,
            groupByValue
        }) => {
            let form = new FormData();
            form.append('in_layer_name', inLayerName)
            if (sortByValue && sortByValue.length > 0)
                form.append('sort_by_attr', sortByValue)
            if (groupByValue && groupByValue.length > 0)
                form.append('group_by_attr', groupByValue)
            form.append('out_layer_name', outLayerName)
            form.append('csrfmiddlewaretoken', getCRSFToken())
            fetch(this.urls.getLineFeatures, {
                method: 'POST',
                body: form,
                credentials: 'same-origin',
            })
                .then(res => {
                    if (res.status == 500) {
                        lineLayersFailure(res)
                    }
                    if (res.status == 200) {
                        lineLayersSuccess(res)
                    }
                })
        }
        const {
            selectedResource,
            sortByValue,
            groupByValue,
            outLayerName,
        } = this.state.publishForm
        const checkedLineFeatures = this.state.outLayersDialog.outLayers.filter(l=>l.checked).map(l=>l.name)
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
            if (groupByValue.length == 0) {
                // get single line feature from all points in the selected point layer
                // submit without checkedLineFeatures
                this.setState({
                    publishForm: {
                        ...this.state.publishForm,
                        errors: {},
                    },
                    loading: true
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

            if (groupByValue.length > 0 && checkedLineFeatures.length == 0) {
                this.setState({
                    publishForm: {
                        ...this.state.publishForm,
                        errors: {},
                    },
                    loading: true
                },
                    () => {
                        getLineFeatures({
                            inLayerName,
                            outLayerName,
                            sortByValue,
                            groupByValue
                        })
                    }
                )
            }
            if (groupByValue.length > 0 && checkedLineFeatures.length > 0) {
                // submit with list of selected line features
                this.setState({
                    publishForm: {
                        ...this.state.publishForm,
                        errors: {},
                    },
                    loading: true
                },
                    () => {
                        submit({
                            inLayerName,
                            outLayerName,
                            sortByValue,
                            groupByValue,
                            checkedLineFeatures
                        })
                    }
                )
            }
        }
    }
    onOutLayerCheckAll(e){
        const outLayers = this.state.step1.outLayers
        if (e.target.checked){
            this.setState({
                step1: {
                    ...this.state.step1,
                    outLayers: outLayers.map(l=>{
                        if (l.numberOfFeatures > 1) return {...l, checked: true}
                        return l
                    })
                }
            })
        }
        else {
            this.setState({
                step1: {
                    ...this.state.step1,
                    outLayers: outLayers.map(l=>{return {...l, checked: false}})
                }
            })
        }
    }
    onOutLayerCheck(e) {
        let layers = [...this.state.step1.outLayers]
        layers = layers.map(l=>{
            if(l.name === e.target.value) {
                l = {
                    ...l,
                    checked: e.target.checked
                }
            }
            return l
        })
        this.setState({
            step1:{
                ...this.state.step1,
                outLayers: layers
            }
        })
    }
    onSearchChange(e){
        this.setState({
            resourceSelectDialog: {
                ...this.state.resourceSelectDialog,
                searchValue: e.target.value,
            },
        }, this.fetchResources)
    }
    render() {
        const props = {
            urls: this.urls,
            resourceSelectProps: {
                ...this.state.resourceSelectDialog,
                handleClose: this.resourceSelectDialogClose,
                onResourceSelect: this.onResourceSelect,
                selectedResource: this.state.publishForm.selectedResource,
                loading: this.state.loading,
                onSearchChange: this.onSearchChange
            },
            step0: {
                ...this.state.step0,
                resourceSelectDialogOpen: this.resourceSelectDialogOpen,
                sortByChange: this.publishChange,
                sortByFilter,
                groupByChange: this.publishChange,
                groupByFilter,
                validateSelectedResource: this.validateSelectedResource,
                getLineFeatures: this.getLineFeatures,
            },
            step1: {
                ...this.state.step1,
                inLayer: this.state.step0.selectedResource,
                groupByValue: this.state.step0.groupByValue,
                onCheck: this.onOutLayerCheck,
                onCheckAll: this.onOutLayerCheckAll,
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
                loading: this.state.loading
            },
            resultsDialog: {
                ...this.state.resultsDialog,
                handleClose: this.resultsDialogClose,
            },
            outLayersDialog: {
                ...this.state.outLayersDialog,
                inLayer: this.state.publishForm.selectedResource,
                groupByValue: this.state.publishForm.groupByValue,
                handleClose: this.outLayersDialogClose,
                onCheck: this.onOutLayerCheck,
                onCheckAll: this.onOutLayerCheckAll,
            }
        }
        return (
            <MainPage {...props} />
        )
    }
}