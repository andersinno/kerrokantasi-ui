import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {injectIntl, intlShape} from 'react-intl';
import PluginContent from '../../components/PluginContent';
import {getHearingWithSlug, getMainSection, getMainSectionComments} from '../../selectors/hearing';
import isEmpty from 'lodash/isEmpty';
import LoadSpinner from '../../components/LoadSpinner';
import getAttr from '../../utils/getAttr';
import {parseQuery} from '../../utils/urlQuery';
import {
  fetchHearing as fetchHearingAction,
  postSectionComment,
  postVote,
  fetchAllSectionComments,
  fetchSectionComments,
  fetchMoreSectionComments,
} from '../../actions';
import Link from '../../components/LinkWithLang';
import Button from 'react-bootstrap/lib/Button';
import Icon from '../../utils/Icon';

export class FullscreenHearingContainerComponent extends React.Component {
  componentWillMount() {
    const {hearing, fetchHearing, match: {params}} = this.props;
    if (isEmpty(hearing)) {
      fetchHearing(params.hearingSlug);
    }
  }

  onPostComment = (text, authorName, pluginData, geojson, label, images) => { // Done
    const sectionCommentData = {text, authorName, pluginData, geojson, label, images};
    const {match, location, mainSection} = this.props;
    const hearingSlug = match.params.hearingSlug;
    const {authCode} = parseQuery(location.search);
    const commentData = Object.assign({authCode}, sectionCommentData);
    this.props.postSectionComment(hearingSlug, mainSection.id, commentData);
  }

  onVoteComment = (commentId) => {
    const {match, mainSection} = this.props;
    const hearingSlug = match.params.hearingSlug;
    const sectionId = mainSection.id;
    this.props.postVote(commentId, hearingSlug, sectionId);
  }

  render() {
    const {
      hearing,
      mainSection,
      mainSectionComments,
      user,
      match,
      fetchAllComments,
      language
    } = this.props;
    const detailURL = '/' + hearing.slug;

    return (
      <div id="hearing">
        {isEmpty(hearing)
        ? <LoadSpinner />
        :
        <div className="fullscreen-hearing">
          <div className="fullscreen-navigation">
            <div className="logo">
              <Link to={{path: "/"}}>
                <img alt="Helsinki" src="/assets/images/helsinki-logo-white.svg" className="logo" />
              </Link>
            </div>
            <div className="header-title">
              <Link to={{path: detailURL, state: {fromFullscreen: true}}}>{getAttr(hearing.title, language)}</Link>
            </div>
            <div className="minimize">
              <Link to={{path: detailURL, state: {fromFullscreen: true}}}>
                <Button>
                  <Icon name="compress" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="plugin-content">
            <PluginContent
              hearingSlug={match.params.hearingSlug}
              fetchAllComments={fetchAllComments}
              section={mainSection}
              comments={mainSectionComments}
              onPostComment={this.onPostComment}
              onPostVote={this.onVoteComment}
              user={user}
            />
          </div>
        </div>
        }
      </div>
    );
  }
}

FullscreenHearingContainerComponent.propTypes = {
  intl: intlShape.isRequired,
  hearing: PropTypes.object,
  match: PropTypes.object,
  location: PropTypes.object,
  mainSection: PropTypes.object,
  user: PropTypes.object,
  mainSectionComments: PropTypes.object,
  fetchHearing: PropTypes.func,
  postSectionComment: PropTypes.func,
  postVote: PropTypes.func,
  fetchAllComments: PropTypes.func,
  language: PropTypes.string
};

const mapStateToProps = (state, ownProps) => ({
  language: state.language,
  hearing: getHearingWithSlug(state, ownProps.match.params.hearingSlug),
  mainSection: getMainSection(state, ownProps.match.params.hearingSlug),
  user: state.user,
  mainSectionComments: getMainSectionComments(state, ownProps.match.params.hearingSlug)
});

const mapDispatchToProps = dispatch => ({
  fetchHearing: (hearingSlug, preview = false) => dispatch(fetchHearingAction(hearingSlug, preview)),
  fetchAllComments: (hearingSlug, sectionId) => dispatch(fetchAllSectionComments(hearingSlug, sectionId)),
  postSectionComment: (hearingSlug, sectionId, commentData) => dispatch(postSectionComment(hearingSlug, sectionId, commentData)),
  postVote: (commentId, hearingSlug, sectionId) => dispatch(postVote(commentId, hearingSlug, sectionId)),
  fetchCommentsForSortableList: (sectionId, ordering) => dispatch(fetchSectionComments(sectionId, ordering)),
  fetchMoreComments: (sectionId, ordering, nextUrl) => dispatch(fetchMoreSectionComments(sectionId, ordering, nextUrl)),
});

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(FullscreenHearingContainerComponent));
