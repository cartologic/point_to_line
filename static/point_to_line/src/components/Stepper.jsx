import React, {Component} from "react";
import PublishForm from "./steps/PublishForm";
export default class Stepper extends Component {
    constructor (props) {
        super(props)
        this.state = {
            current: 0,
        }
        this.next = this.next.bind(this)
        this.previous = this.previous.bind(this)
    }
    next(){
        this.setState({
            current: this.state.current + 1
        })
    }
    previous(){
        this.setState({
            current: this.state.current - 1
        })
    }
    render () {
        const {
            publishForm
        } = this.props
        const steps = [
            {
                component: PublishForm,
                props: {
                    ...publishForm,
                    next: this.next,
                }
            },
        ]
        const step = steps[this.state.current]
        const StepComponent = step.component
        const stepProps = step.props
        return (<StepComponent {...stepProps} />)
    }
}