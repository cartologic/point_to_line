import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Stepper from "./Stepper";
import ResourceSelectDialog from './ResourceSelectDialog'
import ResultsDialog from './ResultsDialog'
import OutLayersDialog from './OutLayersDialog'
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(6, 1),
    marginTop: '50px',
  },
}));
export default (props) => {
  const classes = useStyles();
  const {
    step0,
    step1,
  } = props
  return (
    <div>
      <CssBaseline />
      <Container maxWidth="md">
        <Paper className={classes.root}>
          <Stepper
            step0={{...step0}}
            step1={{...step1}}
          />
          <ResourceSelectDialog {...props.resourceSelectProps} />
          <ResultsDialog {...props.resultsDialog} />
          <OutLayersDialog {...props.outLayersDialog} />
        </Paper>
      </Container>
    </div>
  );
}
