import React, {Component} from "react";
import Step0 from "./steps/Step0";
import Step1 from "./steps/Step1"
import Step2 from "./steps/Step2"
export default class Stepper extends Component {
    constructor (props) {
        super(props)
        this.state = {
            current: 0,
            skipped: [],
        }
        this.next = this.next.bind(this)
        this.skip = this.skip.bind(this)
        this.previous = this.previous.bind(this)
    }
    next(){
        const current = this.state.current
        const next = current + 1
        // remove next from skipped array
        const skipped = this.state.skipped.filter(s=>s!=next)
        
        this.setState({
            current: current + 1,
            skipped: skipped,
        })
    }
    skip(){
        const current = this.state.current
        const next = current + 1
        this.setState({
            current: current + 2,
            skipped: [...this.state.skipped, next]
        })
    }
    previous(){
        const current = this.state.current
        let previous = current - 1
        const skipped = this.state.skipped
        let index = 1
        skipped.forEach(s=>{
            if (s == previous){
                    index += 1
                    previous -= 1
            }
        })
        this.setState({
            current: this.state.current - index
        })
    }
    render () {
        const {
            step0,
            step1,
            step2,
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
            {
                component: Step2,
                props: {
                    ...step2,
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