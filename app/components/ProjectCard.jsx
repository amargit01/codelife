import axios from "axios";
import React, {Component} from "react";
import {connect} from "react-redux";
import {translate} from "react-i18next";
import {Link} from "react-router";
import {PopoverInteractionKind, Dialog} from "@blueprintjs/core";
import {Popover2} from "@blueprintjs/labs";
import "moment/locale/pt-br";
import moment from "moment";
import ReportBox from "components/ReportBox";
import CodeEditor from "components/CodeEditor/CodeEditor";

import "components/ProjectCard.css";

/**
 * ProjectCard, similar to CodeBlockCard, is a small visual container with a Dialog popover to showcase projects.
 * It is used on the Homepage as well as in User Profiles to list their projects
 */

class ProjectCard extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      initialLikeState: "false",
      likes: 0
    };
  }

  /**
   * Project Cards, though small visually, are responsible for containing and controlling their own Dialog
   * Popover that shows the entirety of the project and its code
   */
  toggleDialog() {
    this.setState({open: !this.state.open});
  }

  /** 
   * Admin Only function to promote the given project to featured
   */
  toggleFeature() {
    const {project} = this.props;
    project.featured = !project.featured;
    axios.post("/api/projects/setfeatured", {id: project.id, featured: project.featured}).then(resp => {
      resp.status === 200 ? console.log("success") : console.log("error");
      if (this.props.onToggleFeature) this.props.onToggleFeature();
    });
    this.forceUpdate();
  }

  /** 
   * Admin only function to generate a screenshot for this project (usually so it can be featured on the homepage)
   */
  generateScreenshot() {
    axios.post("/api/projects/generateScreenshot", {id: this.props.project.id}).then(resp => {
      resp.status === 200 ? console.log("success") : console.log("error");
    });
  }

  /**
   * Projects embed a ReportBox to allow for flagging. If a user uses that box to report the content, this
   * callback notifies its parent (this component) that the project has been reported, so state can be updated
   */
  handleReport() {
    const {project} = this.props;
    project.reported = true;
    this.forceUpdate();
  }

  render() {
    const {open} = this.state;
    const {location, project, t, user} = this.props;
    const {id, name, studentcontent, username, reported, featured} = project;

    // If this project was created by the logged in user, use "you" instead of the project owner's name
    const mine = this.props.user && project.uid === this.props.user.id;
    const displayname = mine ? t("you!") : false;

    moment.locale("pt-BR");

    const embedLink = `${ location.origin }/projects/${ username }/${ project.slug ? project.slug : project.name }`;
    const userLink = `${ location.origin }/profile/${ username }`;

    const thumbnailURL = `/pj_images/${project.user ? project.user.username : "error"}/${id}.png?v=${new Date().getTime()}`;
    // In the extremely rare case where a project still exists for which there is no longer a user, don't show a thumbnail
    const thumbnailImg = Boolean(project.user);

    return (
      <div className="card-container" key={id}>

        {/* cover button */}
        { displayname
          // my project; open in projects view
          ? <Link className="card-trigger u-absolute-expand u-margin-top-off u-margin-bottom-off" to={`/projects/${username}/${project.slug ? project.slug : project.name}/edit`}>
            <span className="u-visually-hidden">{t("edit project")}</span>
          </Link>
          // someone else's project; open dialog
          : <button className="card-trigger u-absolute-expand u-unbutton u-margin-top-off u-margin-bottom-off" onClick={ this.toggleDialog.bind(this) }>
            <span className="u-visually-hidden">{ t("Project.View") }</span>
          </button>
        }

        {/* card inner */}
        <div className="project-card card">

          {/* show thumbnail image if one is found */}
          { thumbnailImg
            ? <div className="card-img" style={{backgroundImage: `url("${thumbnailURL}")`}}>
              <span className={`card-action-icon pt-icon ${ !displayname ? "pt-icon-fullscreen" : "pt-icon-edit" }`} />
            </div>
            : null }

          {/* caption */}
          <div className="card-caption project-card-caption">

            {/* title */}
            <h3 className="card-title font-sm u-margin-top-off u-margin-bottom-off">
              { name !== "mypage.html" ? name : t("Card.NewProject") }
            </h3>

            {/* author */}
            { username &&
              <span className="card-author font-xs">
                { t("Card.MadeBy") }&nbsp;
                {user
                  ? <Link className="card-author-link link" to={`/profile/${username}`}>
                    { username ? displayname || username : t("anonymous user") }
                  </Link>
                  : username ? displayname || username : t("anonymous user")
                }
              </span>
            }

            {/* likes */}
            {/* <p className="card-likes font-xs u-margin-top-off" id={`project-card-${id}`}>
              <button className={ `card-likes-button pt-icon-standard u-unbutton u-margin-top-off ${ liked ? "pt-icon-star" : "pt-icon-star-empty" }` }
              onClick={ this.toggleLike.bind(this) }
              aria-labelledby={`project-card-${id}` } />
              <span className="card-likes-count">0</span>
              <span className="u-visually-hidden">&nbsp;
                ${ likes === 1 ? t("Like") : t("Likes") }
              </span>
            </p> */}

            {/* datemodified ? <div className="card-author">{ t("Modified on") } { moment(datemodified).format("DD/MM/YY") }</div> : null */}
          </div>
        </div>


        {/* dialog */}
        <Dialog
          isOpen={ open }
          onClose={ this.toggleDialog.bind(this) }
          title={ name }
          lazy={false}
          inline={true}
          className="card-dialog project-dialog is-fullscreen u-padding-bottom-off" >

          {/* main content */}
          <div className="card-dialog-inner project-dialog-inner pt-dialog-body">
            <CodeEditor
              initialValue={studentcontent}
              readOnly={true}
              ref={c => this.editor = c}
              noZoom={true} />
          </div>

          {/* footer */}
          <div className="card-dialog-footer project-dialog-footer pt-dialog-footer u-margin-top-off-children u-margin-bottom-off-children">

            {/* created by */}
            <p className="card-dialog-footer-byline project-dialog-footer-byline pt-dialog-footer-byline font-sm">
              {t("Created by")}&nbsp;
              {user
                ? <a href={userLink} className="project-dialog-link user-link">
                  { username ? displayname || username : t("anonymous user") }
                </a>
                : username ? displayname || username : t("anonymous user")
              }

              {/* show edit link if it's yours */}
              { displayname &&
                <span className="edit-link-container">
                  &nbsp;(<Link className="edit-link link" to={`/projects/${username}/${project.slug ? project.slug : project.name}/edit`}>
                    {t("edit project")}
                  </Link>)
                </span>
              }

              <a href={ embedLink } target="_blank" rel="noopener noreferrer" className="project-dialog-link share-link font-xs">{ embedLink }</a>
            </p>

            {/* show actions if logged in */}
            { user &&
              <div className="card-dialog-footer-actions project-dialog-footer-actions pt-dialog-footer-actions">

                {/* flag content */}
                <Popover2
                  className="card-dialog-flag-container"
                  popoverClassName="pt-popover-content-sizing"
                  interactionKind={PopoverInteractionKind.CLICK}
                  placement="bottom-end" >

                  {/* flag button */}
                  <button className={`card-dialog-footer-action project-dialog-footer-action flag-button ${reported && "is-flagged" } u-unbutton font-xs`}>
                    <span className="card-dialog-footer-action-icon project-dialog-footer-action-icon flag-button-icon pt-icon pt-icon-flag" />
                    <span className="card-dialog-footer-action-text project-dialog-footer-action-text">
                      {reported ? "Flagged" : "Flag"}
                    </span>
                  </button>

                  {/* flag form */}
                  <ReportBox
                    reportid={id}
                    contentType="project"
                    handleReport={this.handleReport.bind(this)}
                  />
                </Popover2>

                {/* show feature & screenshot buttons if user is admin */}
                { user.role === 2 &&
                  <div className="u-button-group">
                    <button
                      onClick={this.toggleFeature.bind(this)}
                      className={`card-feature-button pt-button pt-intent-primary font-xs${ featured ? " is-featured" : "" }`}>
                      { featured && <span className="pt-icon pt-icon-tick" /> }
                      <span className="u-hide-below-md">
                        { featured ? t("Featured") : t("Feature") }
                      </span>
                    </button>
                    <button
                      onClick={this.generateScreenshot.bind(this)}
                      className="card-screenshot-button pt-button pt-intent-primary font-xs">
                      <span className="pt-icon pt-icon-camera" />
                      <span className="u-hide-below-md">
                        {t("Screenshot")}
                      </span>
                    </button>
                  </div>
                }
              </div>
            }


          </div>
        </Dialog>
      </div>
    );
  }
}

ProjectCard = connect(state => ({
  location: state.location,
  user: state.auth.user
}))(ProjectCard);
ProjectCard = translate()(ProjectCard);
export default ProjectCard;
