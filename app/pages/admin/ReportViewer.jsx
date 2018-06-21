import axios from "axios";
import React, {Component} from "react";
import {connect} from "react-redux";
import {translate} from "react-i18next";
import {button, Position, Toaster, Tooltip, Intent} from "@blueprintjs/core";
import PropTypes from "prop-types";
import Thread from "components/Thread";
import Comment from "components/Comment";
import LoadingSpinner from "components/LoadingSpinner";

import "./ReportViewer.css";

class ReportViewer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mounted: false,
      projectReports: [],
      codeblockReports: [],
      threadReports: [],
      commentReports: [],
      reports: [],
      isOpen: false
    };
  }

  loadFromDB() {
    const cbget = axios.get("/api/reports/codeblocks/all");
    const pget = axios.get("/api/reports/projects/all");
    const tget = axios.get("/api/reports/threads/all");
    const cget = axios.get("/api/reports/comments/all");
    const rget = axios.get("/api/reports/discussions");

    Promise.all([cbget, pget, tget, cget, rget]).then(resp => {
      const mounted = true;
      const codeblockReports = resp[0].data;
      const projectReports = resp[1].data;
      const threadReports = resp[2].data;
      const commentReports = resp[3].data;
      const reports = resp[4].data;
      this.setState({mounted, codeblockReports, projectReports, threadReports, commentReports, reports});
    });
  }

  componentDidMount() {
    this.loadFromDB();
  }

  handleOK(type, report) {
    const {t} = this.props;
    if (type) {
      axios.post(`/api/${type}/setstatus`, {status: "approved", id: report.report_id}).then(resp => {
        if (resp.status === 200) {
          const toast = Toaster.create({className: "OKToast", position: Position.TOP_CENTER});
          toast.show({message: t("Content Approved"), intent: Intent.SUCCESS});
        }
        else {
          const toast = Toaster.create({className: "ErrorToast", position: Position.TOP_CENTER});
          toast.show({message: t("Database Error"), intent: Intent.DANGER});
        }
        this.loadFromDB();
      });
    }
  }

  handleBan(type, report) {
    const {t} = this.props;
    const {browserHistory} = this.context;
    if (type) {
      axios.post(`/api/${type}/setstatus`, {status: "banned", id: report.report_id}).then(resp => {
        if (resp.status === 200) {
          const toast = Toaster.create({className: "OKToast", position: Position.TOP_CENTER});
          toast.show({message: t("Content Banned"),
            intent: Intent.DANGER,
            action: {
              text: "View User Page",
              onClick: () => browserHistory.push(`/profile/${report.username}`)
            }});
        }
        else {
          const toast = Toaster.create({className: "ErrorToast", position: Position.TOP_CENTER});
          toast.show({message: t("Database Error"), intent: Intent.DANGER});
        }
        this.loadFromDB();
      });
    }
  }

  createPageRow(type, report) {
    const shortFilename = report.filename.length > 20 ? `${report.filename.substring(0, 20)}...` : report.filename;
    let strReasons = "";
    let strComments = "";
    for (const r of report.reasons) strReasons += `${r}\n`;
    for (const c of report.comments) strComments += `${c}\n`;
    return <tr key={report.id}>
      <td>
        <a target="_blank" href={`/${type}/${report.username}/${report.filename}`}>
          {shortFilename}
        </a>
      </td>
      <td>{report.username}</td>
      <td style={{whiteSpace: "pre-wrap"}}>{strReasons}</td>
      <td style={{whiteSpace: "pre-wrap"}}>{strComments}</td>
      <td className="actions-cell font-xs">
        <span className="actions-cell-inner u-button-group">
          <button className="inverted-button button success" onClick={this.handleOK.bind(this, type, report)}>
            <span className="pt-icon pt-icon-tick" />
            <span className="u-hide-below-md">allow</span>
          </button>
          <button className="inverted-button button danger-button" onClick={this.handleBan.bind(this, type, report)}>
            <span className="pt-icon pt-icon-trash" />
            <span className="u-hide-below-md">ban</span>
          </button>
        </span>
      </td>
    </tr>;
  }

  createDiscRow(type, report) {
    // if (report.commentref) author = report.commentref.user.username;
    // if (report.thread) author = report.thread.user.username;
    let strReasons = "";
    let strComments = "";
    for (const r of report.reasons) strReasons += `${r}\n`;
    for (const c of report.comments) strComments += `${c}\n`;
    return <tr key={report.id}>
      {
        type === "threads"
          ? <Thread thread={report.thread} />
          : <Comment comment={report.commentref} />
      }
      <td style={{whiteSpace: "pre-wrap"}}>{strReasons}</td>
      <td style={{whiteSpace: "pre-wrap"}}>{strComments}</td>
      <td className="actions-cell font-xs">
        <span className="actions-cell-inner u-button-group">
          <button className="inverted-button button success" onClick={this.handleOK.bind(this, type, report)}>
            <span className="pt-icon pt-icon-tick" />
            <span className="u-hide-below-md">allow</span>
          </button>
          <button className="inverted-button button danger-button" onClick={this.handleBan.bind(this, type, report)}>
            <span className="pt-icon pt-icon-trash" />
            <span className="u-hide-below-md">ban</span>
          </button>
        </span>
      </td>
    </tr>;
  }

  groupReports(reports) {
    const grouped = [];
    for (const report of reports) {
      const gr = grouped.find(gr => gr.report_id === report.report_id);
      if (gr) {
        gr.ids.push(report.id);
        gr.reasons.push(report.reason);
        gr.comments.push(report.comment);
      }
      else {
        const obj = {
          ids: [report.id],
          report_id: report.report_id,
          username: report.username,
          commentref: report.commentref,
          thread: report.thread,
          email: report.email,
          filename: report.filename,
          reasons: [report.reason],
          comments: [report.comment],
          permalink: report.permalink
        };
        grouped.push(obj);
      }
    }
    return grouped;
  }

  render() {

    const {mounted, codeblockReports, projectReports, threadReports, commentReports} = this.state;
    const {t} = this.props;

    if (!mounted) return <LoadingSpinner />;

    const cbSorted = this.groupReports(codeblockReports);
    const pSorted = this.groupReports(projectReports);
    const tSorted = this.groupReports(threadReports);
    const cSorted = this.groupReports(commentReports);

    const codeblockItems = cbSorted.map(r => this.createPageRow("codeBlocks", r));
    const projectItems = pSorted.map(r => this.createPageRow("projects", r));
    const threadItems = tSorted.map(r => this.createDiscRow("threads", r));
    const commentItems = cSorted.map(r => this.createDiscRow("comments", r));

    return (
      <div id="ReportViewer">
        <h2 className="report-title">Codeblocks</h2>
        <table className="pt-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Author</th>
              <th>Reasons</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{codeblockItems.length > 0 ? codeblockItems : t("No items are currently flagged")}</tbody>
        </table>
        <h2 className="report-title">Projects</h2>
        <table className="pt-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Author</th>
              <th>Reason</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{projectItems.length > 0 ? projectItems : t("No items are currently flagged")}</tbody>
        </table>
        <h2 className="report-title">Threads</h2>
        <table className="pt-table threads-table">
          <thead>
            <tr>
              <th>Thread</th>
              <th>Reason</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{threadItems.length > 0 ? threadItems : t("No items are currently flagged")}</tbody>
        </table>
        <h2 className="report-title">Comments</h2>
        <table className="pt-table comments-table">
          <thead>
            <tr>
              <th>Comment</th>
              <th>Reason</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{commentItems.length > 0 ? commentItems : t("No items are currently flagged")}</tbody>
        </table>
      </div>
    );
  }
}

ReportViewer.contextTypes = {
  browserHistory: PropTypes.object
};

ReportViewer = connect(state => ({
  auth: state.auth
}))(ReportViewer);
ReportViewer = translate()(ReportViewer);
export default ReportViewer;
