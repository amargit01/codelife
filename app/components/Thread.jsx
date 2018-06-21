import axios from "axios";
import {connect} from "react-redux";
import React, {Component} from "react";
import {Link} from "react-router";
import {translate} from "react-i18next";
import {Collapse, Button, Toaster, Position, Intent, Popover, PopoverInteractionKind, Tooltip} from "@blueprintjs/core";
import ReportBox from "components/ReportBox";
import Comment from "components/Comment";
import "./Thread.css";
import QuillWrapper from "pages/admin/lessonbuilder/QuillWrapper";

import LoadingSpinner from "components/LoadingSpinner";

class Thread extends Component {

  constructor(props) {
    super(props);
    this.state = {
      thread: null,
      commentTitle: "",
      commentContent: "",
      showComments: false
    };
  }

  componentDidMount() {
    const {thread} = this.props;
    this.setState({thread});
  }

  toggleComments() {
    this.setState({showComments: !this.state.showComments});
  }

  toggleLike() {
    const {thread} = this.state;
    const liked = !thread.liked;
    axios.post("/api/likes/save", {type: "thread", liked, likeid: thread.id}).then(resp => {
      if (resp.status === 200) {
        if (liked) {
          thread.likes++;
          thread.liked = true;
        }
        else {
          thread.likes--;
          thread.liked = false;
        }
        this.setState({thread});
      }
      else {
        console.log("error");
      }
    });
  }

  newComment() {
    const {t} = this.props;
    const {thread, commentTitle, commentContent} = this.state;
    const commentPost = {
      title: commentTitle,
      content: commentContent,
      thread_id: thread.id
    };
    axios.post("/api/comments/new", commentPost).then(resp => {
      if (resp.status === 200) {
        const toast = Toaster.create({className: "newCommentToast", position: Position.TOP_CENTER});
        toast.show({message: t("Comment Posted!"), timeout: 1500, intent: Intent.SUCCESS});
        this.setState({thread: resp.data, commentTitle: "", commentContent: ""});
      }
    });
  }

  formatDate(datestring) {
    const date = new Date(datestring);
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);
    // const hours = `0${date.getHours()}`.slice(-2);
    // const minutes = `0${date.getMinutes()}`.slice(-2);
    // return `${day}/${month}/${year} - ${hours}:${minutes}`;
    return `${day}/${month}/${year}`;
  }

  handleReport(report) {
    const {thread} = this.state;
    thread.report = report;
    this.setState({thread});
  }

  render() {

    const {t: t} = this.props;
    const {thread, commentTitle, commentContent} = this.state;

    if (!thread) return <LoadingSpinner />;

    return (
      <span className="thread">
        <span className="thread-header">

          <span className="thread-content">

            {/* post title */}
            <h3 className="thread-title u-margin-bottom-off">
              { thread.title }
            </h3>

            {/* meta */}
            <span className="thread-user font-xs">
              { t("by") } <Link className="link font-sm" to={ `/profile/${thread.user.username}`}>
                { thread.user.username }
                {/* role */}
                { thread.user.role !== 0 &&
                  <span className="thread-user-role font-xs"> (
                    { thread.user.role === 1
                      ? t("Contributor")
                      : thread.user.role === 2 &&
                        t("Admin")
                    })
                  </span>
                }
              </Link>
              {/* date posted */}
              <span className="thread-date">
                { `${t("on")} ${this.formatDate(thread.date)}` }
              </span>
            </span>
          </span>

          <span className="thread-actions">
            <span className="like-thread">
              <Button
                intent={thread.liked ? Intent.WARNING : Intent.DEFAULT}
                iconName={ `star${ thread.liked ? "" : "-empty"}` }
                onClick={ this.toggleLike.bind(this) }
                text={ `${ thread.likes } ${ thread.likes === 1 ? t("Like") : t("Likes") }` }
              />
            </span>
            <span className="report-thread">
              <Popover
                interactionKind={PopoverInteractionKind.CLICK}
                popoverClassName="pt-popover-content-sizing"
                position={Position.TOP_RIGHT}
                inline={true}
              >
                <Button
                  intent={thread.report ? Intent.DANGER : Intent.DEFAULT}
                  iconName="flag"
                  className={ thread.report ? "" : "pt-minimal" }
                  text={ thread.report ? "Flagged" : "Flag"}
                />
                <span style={{textAlign: "left"}}>
                  <ReportBox reportid={thread.id} permalink={this.props.permalink} contentType="thread" handleReport={this.handleReport.bind(this)} />
                </span>
              </Popover>
            </span>
          </span>
        </span>


        {/* post content */}
        <span className="thread-body" dangerouslySetInnerHTML={{__html: thread.content}} />


        {/* show / hide comments */}
        <button className="link u-unbutton font-sm u-margin-top-xs" onClick={this.toggleComments.bind(this)}>
          <span className="pt-icon pt-icon-chat" />
          { this.state.showComments
            // currently showing comments; hide them
            ? t("hide comments")
            // not currently showing comments; show them
            : thread.commentlist.length
              // we got comments; show comment count
              ? `${ t("show") } ${ thread.commentlist.length } ${ thread.commentlist.length === 1 ? t("comment") : t("comments") }`
              // no comments; prompt to add comment
              : t("add comment")
          }
        </button>

        {/* comments */}
        <span className="comments">
          <Collapse isOpen={this.state.showComments} component="span">
            { thread.commentlist.map(c => <Comment key={c.id} comment={c} />) }
            {
              this.state.showComments &&
                <span className="new-comment">
                  <h3 className="new-comment-title u-margin-top-md">{t("Post New Comment")}</h3>
                  <input className="pt-input" value={this.state.commentTitle} onChange={e => this.setState({commentTitle: e.target.value})} placeholder={t("Title")} />
                  <QuillWrapper hideGlossary={true} value={this.state.commentContent} onChange={tx => this.setState({commentContent: tx})} />
                  <Button
                    className="pt-intent-success post-button pt-fill"
                    onClick={this.newComment.bind(this)}
                    disabled={!commentTitle || !commentContent || commentContent === "<p><br></p>"}
                  >
                    {t("Post Comment")}
                  </Button>
                </span>
            }
          </Collapse>
        </span>
      </span>
    );
  }
}

Thread = connect(state => ({
  auth: state.auth,
  location: state.location
}))(Thread);
Thread = translate()(Thread);
export default Thread;
