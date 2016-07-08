import Button from 'react-bootstrap/lib/Button';
import BaseCommentForm from '../BaseCommentForm';
import CommentDisclaimer from "../CommentDisclaimer";
import Input from 'react-bootstrap/lib/Input';
import React from 'react';
import {injectIntl, FormattedMessage} from 'react-intl';
import {alert} from '../../utils/notify';


class MapdonKSVPlugin extends BaseCommentForm {
  constructor(props) {
    super(props);
    this.pluginInstanceId = "ksv" + (0 | (Math.random() * 10000000));
    this.state = Object.assign(this.state, {userDataChanged: false});
    this.lastUserData = null;
    this.submitting = false;
  }

  render() {
    const canSetNickname = this.props.canSetNickname;
    const buttonDisabled = this.submitting || (!this.state.commentText && !this.state.userDataChanged);
    const pluginPurpose = this.props.pluginPurpose;
    const commentBox = (
      <div>
        <br/>
        <Input
          type="textarea"
          onChange={this.handleTextChange.bind(this)}
          value={this.state.commentText}
          placeholder="Kommentoi ehdotustasi tässä."
        />
        {canSetNickname ? <h3><FormattedMessage id="nickname"/></h3> : null}
        {canSetNickname ? (
          <Input
            type="text"
            placeholder={this.props.intl.formatMessage({id: "anonymous"})}
            value={this.state.nickname}
            onChange={this.handleNicknameChange.bind(this)}
            maxLength={32}
          />
        ) : null}
        <p>
          <Button bsStyle="primary" onClick={this.getDataAndSubmitComment.bind(this)} disabled={buttonDisabled}>
            Lähetä ehdotus
          </Button>
        </p>
        <CommentDisclaimer/>
      </div>
    );
    return (
      <div className="plugin-comment-form mapdon-ksv-plugin-comment-form">
        <form>
          <iframe
            src="/assets/mapdon-ksv/plugin-inline.html"
            className="plugin-frame mapdon-ksv-plugin-frame"
            ref="frame"
          ></iframe>
          {pluginPurpose === 'postComments' ? commentBox : null}
        </form>
      </div>
    );
  }

  sendMessageToPluginFrame(message) {
    this.refs.frame.contentWindow.postMessage(message, "*");
  }

  requestData() {
    this.sendMessageToPluginFrame({
      message: "getUserData",
      instanceId: this.pluginInstanceId
    });
  }

  getDataAndSubmitComment() {
    this.submitting = true;
    this.requestData();
  }

  getPluginData() {
    return this.lastUserData;
  }

  onReceiveMessage(event) {
    const pluginPurpose = this.props.pluginPurpose;
    // override user messages if in visualization mode
    if (pluginPurpose !== 'postComments') {
      return;
    }
    const payload = event.data;
    if (typeof payload === 'string') {
      return;
    }
    if (payload.instanceId !== this.pluginInstanceId) {
      return;
    }

    if (payload.message === "userDataChanged") {
      this.setState({userDataChanged: true});
    }

    if (payload.message === "userData") {
      this.lastUserData = payload.data;
      if (this.submitting) {
        this.submitting = false;
        if (this.lastUserData) {
          this.submitComment();
        } else {
          alert("Et muuttanut mitään kartassa.");
        }
      }
    }
  }

  clearCommentText() {
    // after successful posting, user data shall be decimated from the map
    this.setState({userDataChanged: false});
    super.clearCommentText();
  }

  componentDidMount() {
    super.componentDidMount();
    const iframe = this.refs.frame;
    const {data, pluginPurpose} = this.props;
    let {comments} = this.props;
    if (!comments) {
      comments = [];
    }
    if (!this._messageListener) {
      this._messageListener = this.onReceiveMessage.bind(this);
      window.addEventListener("message", this._messageListener, false);
    }

    iframe.addEventListener("load", () => {
      this.sendMessageToPluginFrame({
        message: "mapData",
        data,
        pluginPurpose,
        comments,
        instanceId: this.pluginInstanceId
      });
    }, false);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this._messageListener) {
      window.removeEventListener("message", this._messageListener, false);
      this._messageListener = null;
    }
  }

  componentWillUpdate(nextProps, nextState) {
    const {data, pluginPurpose} = this.props;
    let {comments} = this.props;
    if (!comments) {
      comments = [];
    }
    // do not redraw plugin contents if user has interacted with the plugin!
    if (!nextState.userDataChanged) {
      this.sendMessageToPluginFrame({
        message: "mapData",
        data,
        pluginPurpose,
        comments,
        instanceId: this.pluginInstanceId
      });
    }
  }
}

MapdonKSVPlugin.propTypes = {
  onPostComment: React.PropTypes.func,
  data: React.PropTypes.string,
  pluginPurpose: React.PropTypes.string,
  comments: React.PropTypes.array,
  canSetNickname: React.PropTypes.bool,
};

export default injectIntl(MapdonKSVPlugin);
