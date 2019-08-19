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
                outLayerName: ''
            }
        }
        // globalURLS are predefined in index.html otherwise use the following defaults
        this.urls = globalURLS
        this.fetchResources = this.fetchResources.bind(this)
        this.resourceSelectDialogClose = this.resourceSelectDialogClose.bind(this)
        this.resourceSelectDialogOpen = this.resourceSelectDialogOpen.bind(this)
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
    apply() {
        const {
            selectedResource,
            sortByValue,
            groupByValue,
            outLayerName,
        } = this.state.publishForm
        let form = new FormData();
        form.append('in_layer_name', selectedResource.name)
        form.append('sort_by_attr', sortByValue)
        form.append('group_by_attr', groupByValue)
        form.append('out_layer_name', outLayerName)
        form.append('csrfmiddlewaretoken', getCRSFToken())
        fetch(this.urls.generateLineLayer, {
            method: 'POST',
            body: form,
            credentials: 'same-origin',
        })
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
            }
        }
        return (
            <MainPage {...props} />
        )
    }
}