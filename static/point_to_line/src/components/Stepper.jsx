import React, {Component} from "react";
import PublishForm from "./steps/PublishForm";
import Step0 from "./steps/Step0";
import Step1 from "./steps/Step1"
export default class Stepper extends Component {
    constructor (props) {
        super(props)
        this.state = {
            current: 0,
        }
        this.next = this.next.bind(this)
        this.skip = this.skip.bind(this)
        this.previous = this.previous.bind(this)
    }
    next(){
        this.setState({
            current: this.state.current + 1
        })
    }
    skip(){
        this.setState({
            current: this.state.current + 2
        })
    }
    previous(){
        this.setState({
            current: this.state.current - 1
        })
    }
    render () {
        const {
            step0,
            step1,
        } = this.props
        const steps = [
            {
                component: Step0,
                props: {
                    ...step0,
                    next: this.next,
                    skip: this.skip,
                },
            },
            {
                component: Step1,
                props: {
                    ...step1,
                    next: this.next,
                    previous: this.previous,
                },
            },
        ]
        const step = steps[this.state.current]
        const StepComponent = step.component
        const stepProps = step.props
        return (<StepComponent {...stepProps} />)
    }
}