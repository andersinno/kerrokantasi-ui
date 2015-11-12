import React from 'react';
import {injectIntl, FormattedMessage} from 'react-intl';
import Scenario from './Scenario';

class ScenarioList extends React.Component {
  render() {
    const {scenarios} = this.props;
    if (scenarios.length === 0) {
      return (<div>
          <h2><FormattedMessage id="hearing-scenarios"/></h2>
          <p><FormattedMessage id="no-scenarios-available"/></p>
      </div>);
    }
    return (<div>
      <h2><FormattedMessage id="hearing-scenarios"/></h2>
      {scenarios.map((scenario) => <Scenario data={scenario} key={scenario.id} onPostComment={this.props.onPostScenarioComment}/>)}
    </div>);
  }
}

ScenarioList.propTypes = {
  scenarios: React.PropTypes.array,
  onPostScenarioComment: React.PropTypes.function
};

export default (injectIntl(ScenarioList));
