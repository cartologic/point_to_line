import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Forward from '@material-ui/icons/ArrowForward';
import Back from '@material-ui/icons/ArrowBack';

const useStyles = makeStyles(theme => ({
    iconLeft: {
      marginRight: theme.spacing(1),
    },
    iconRight: {
        marginLeft: theme.spacing(1),
      },
  }));


export default (props) => {
    const classes = useStyles()
    const {
        disabled,
        className,
        next,
        onClick
    } = props
    return (
        <Button
            variant="contained"
            color="primary"
            className={className || ''}
            disabled={disabled || false}
            onClick={onClick}>
            {next && 'Next'}
            {next && <Forward className={classes.iconRight} />}

            {!next && <Back className={classes.iconLeft}/>}
            {!next && 'Previous'}
         </Button>
    )
}