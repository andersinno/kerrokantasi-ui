import Icon from '../../utils/Icon';
import React from 'react';
import PropTypes from 'prop-types';
import {injectIntl, intlShape, FormattedMessage} from 'react-intl';
import {get, isEmpty} from 'lodash';
import {localizedNotifyError} from '../../utils/notify';
import {QuestionForm} from './QuestionForm';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Image from 'react-bootstrap/lib/Image';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';

import Dropzone from 'react-dropzone';

import MultiLanguageTextField, {TextFieldTypes} from '../forms/MultiLanguageTextField';
import {sectionShape} from '../../types';
import {isSpecialSectionType} from '../../utils/section';

const MAX_IMAGE_SIZE = 999999;

class SectionForm extends React.Component {
  constructor(props) {
    super(props);
    this.onFileDrop = this.onFileDrop.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  /**
   * Modify section state and propagate necessary information
   * up to the parent components.
   * @param  {object} - OnClick event
   */
  onChange(event) {
    // Propagate interestin changes to parent components
    const {name: field, value} = event.target;
    const section = this.props.section;
    switch (field) {
      case "imageCaption":
        this.props.onSectionImageChange(section.frontId, "caption", value);
        break;
      default:
        this.props.onSectionChange(section.frontId, field, value);
    }
  }

  onFileDrop(files) {
    if (files[0].size > MAX_IMAGE_SIZE) {
      localizedNotifyError('imageSizeError');
      return;
    }
    const section = this.props.section;
    const file = files[0];  // Only one file is supported for now.
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      if (this.props.onSectionImageChange) {
        this.props.onSectionImageChange(section.frontId, "image", fileReader.result);
      }
    }, false);
    fileReader.readAsDataURL(file);
  }

  getImagePreview() {
    if (this.getImage()) {
      return (<Image className="preview" src={this.getImage()} responsive />);
    }
    return false;
  }

  getImage() {
    const images = this.props.section.images;
    if (images && images.length) {
      // Image property may contain the base64 encoded image
      return images[0].image || images[0].url;
    }
    return "";
  }

  static getImageCaption(section) {
    return get(section.images, '[0].caption', {});
  }

  render() {
    const {
      section,
      addOption,
      deleteOption,
      onSectionChange,
      onSectionImageChange,
      sectionLanguages,
      sectionMoveUp,
      sectionMoveDown,
      isFirstSubsection,
      isLastSubsection,
      onQuestionChange,
      onDeleteTemporaryQuestion,
      onDeleteExistingQuestion,
    } = this.props;
    const {language} = this.context;
    const imageCaption = SectionForm.getImageCaption(section, language);
    const dropZoneClass = this.getImage() ? "dropzone preview" : "dropzone";
    const {formatMessage} = this.props.intl;

    return (
      <div className="form-step">
        {section.type !== 'closure-info' && section.type !== 'main' &&
        <div className="section-toolbar">
          <ButtonGroup bsSize="small">
            <Button
              bsStyle="default"
              className="btn"
              type="button"
              onClick={() => sectionMoveUp(section.frontId)}
              disabled={isFirstSubsection}
              style={{marginRight: '10px'}}
            >
              &uarr; <FormattedMessage id="moveUp" />
            </Button>
            <Button
              bsStyle="default"
              className="btn"
              type="button"
              onClick={() => sectionMoveDown(section.frontId)}
              disabled={isLastSubsection}
            >
              <FormattedMessage id="moveDown" /> &darr;
            </Button>
          </ButtonGroup>
        </div>
        }
        <FormGroup controlId="image">

          {
            !isSpecialSectionType(section.type) ?
              <MultiLanguageTextField
                labelId="sectionTitle"
                name="title"
                onBlur={(value) => onSectionChange(section.frontId, 'title', value)}
                value={section.title}
                languages={sectionLanguages}
                placeholderId="sectionTitlePlaceholder"
              /> : null
          }

          <ControlLabel><FormattedMessage id="sectionImage"/></ControlLabel>
          <Dropzone
            accept="image/*"
            className={dropZoneClass}
            multiple={false}
            onDrop={this.onFileDrop}
          >
            {this.getImagePreview()}
            <div className="overlay">
              <span className="text">
                <FormattedMessage id="selectOrDropImage"/>
                <Icon className="icon" name="upload"/>
              </span>
            </div>
          </Dropzone>
          <HelpBlock><FormattedMessage id="sectionImageHelpText"/></HelpBlock>
        </FormGroup>

        <MultiLanguageTextField
          labelId="sectionImageCaption"
          name="imageCaption"
          onBlur={(value) => onSectionImageChange(section.frontId, 'caption', value)}
          value={imageCaption}
          languages={sectionLanguages}
          placeholderId="sectionImagePlaceholder"
        />

        <MultiLanguageTextField
          labelId="sectionAbstract"
          maxLength={this.props.maxAbstractLength}
          name="abstract"
          onBlur={(value) => onSectionChange(section.frontId, 'abstract', value)}
          value={section.abstract}
          languages={sectionLanguages}
          fieldType={TextFieldTypes.TEXTAREA}
          placeholderId="sectionAbstractPlaceholder"
        />

        <MultiLanguageTextField
          richTextEditor
          labelId="sectionContent"
          name="content"
          onBlur={(value) => onSectionChange(section.frontId, 'content', value)}
          rows="10"
          value={section.content}
          languages={sectionLanguages}
          fieldType={TextFieldTypes.TEXTAREA}
          placeholderId="sectionContentPlaceholder"
        />

        <FormGroup controlId="hearingCommenting">
          <ControlLabel><FormattedMessage id="hearingCommenting"/></ControlLabel>
          <div className="select">
            <FormControl
              componentClass="select"
              name="commenting"
              onChange={this.onChange}
            >
              <option selected={section.commenting === 'open'} value="open">{formatMessage({id: "openCommenting"})}</option>
              <option selected={section.commenting === 'registered'} value="registered">{formatMessage({id: "registeredUsersOnly"})}</option>
              <option selected={section.commenting === 'none'} value="none">{formatMessage({id: "noCommenting"})}</option>
            </FormControl>
          </div>
        </FormGroup>
        <FormGroup>
          <button className="btn btn-default question-control" type="button" onClick={() => this.props.initSingleChoiceQuestion(section.frontId)}>
            {formatMessage({id: "newSingleChoiceQuestion"})}
          </button>
          <button className="btn btn-default question-control" type="button" onClick={() => this.props.initMultipleChoiceQuestion(section.frontId)}>
            {formatMessage({id: "newMultipleChoiceQuestion"})}
          </button>
        </FormGroup>
        {!isEmpty(section.questions) && section.questions.map((question, index) =>
          <div>
            <h5>{`${formatMessage({id: "question"})} ${index + 1}`}</h5>
            {question.frontId &&
              <button type="button" className="btn btn-danger pull-right" onClick={() => onDeleteTemporaryQuestion(section.frontId, question.frontId)}>
                {formatMessage({id: "deleteQuestion"})}
              </button>
            }
            <FormGroup>
              <h6>
                * {
                  question.type === 'single-choice'
                    ? formatMessage({id: "singleChoiceQuestion"})
                    : formatMessage({id: "multipleChoiceQuestion"})
                }
              </h6>
            </FormGroup>
            <QuestionForm
              key={question.id}
              question={question}
              addOption={addOption}
              deleteOption={deleteOption}
              sectionId={section.frontId}
              sectionLanguages={sectionLanguages}
              onQuestionChange={onQuestionChange}
              onDeleteExistingQuestion={onDeleteExistingQuestion}
              lang={language}
            />
          </div>
        )}
      </div>
    );
  }
}

SectionForm.defaultProps = {
  maxAbstractLength: 450
};

SectionForm.propTypes = {
  intl: intlShape.isRequired,
  maxAbstractLength: PropTypes.number,
  onSectionChange: PropTypes.func,
  onSectionImageChange: PropTypes.func,
  section: sectionShape,
  sectionLanguages: PropTypes.arrayOf(PropTypes.string),
  sectionMoveUp: PropTypes.func,
  sectionMoveDown: PropTypes.func,
  isFirstSubsection: PropTypes.bool,
  isLastSubsection: PropTypes.bool,
  clearQuestions: PropTypes.func,
  initSingleChoiceQuestion: PropTypes.func,
  initMultipleChoiceQuestion: PropTypes.func,
  addOption: PropTypes.func,
  deleteOption: PropTypes.func,
  onQuestionChange: PropTypes.func,
  onDeleteTemporaryQuestion: PropTypes.func,
  onDeleteExistingQuestion: PropTypes.func,
};

SectionForm.contextTypes = {
  language: PropTypes.string
};

const WrappedSectionForm = injectIntl(SectionForm);

export default WrappedSectionForm;
