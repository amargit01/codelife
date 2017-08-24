import React, {Component} from "react";
import {connect} from "react-redux";
import {translate} from "react-i18next";
import Loading from "components/Loading";

import "./LevelEditor.css";

class LevelEditor extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    const {data} = this.props;
    this.setState({data});   
  }

  componentDidUpdate() {
    if (this.props.data.id !== this.state.data.id) {
      this.setState({data: this.props.data});
    }
  }

  render() {

    const {data} = this.state;

    if (!data) return <Loading />;
    
    return (
      <div id="level-editor">
        <label className="pt-label">
          id
          <span className="pt-text-muted"> (unique)</span>
          <input className="pt-input" type="text" placeholder="Enter a unique level id e.g. level-1" dir="auto" value={data.id} />
        </label>
        <label className="pt-label">
          Name
          <input className="pt-input" type="text" placeholder="Enter the name of this Island" dir="auto" value={data.name}/>
        </label>
        <label className="pt-label">
          Description
          <input className="pt-input" type="text" placeholder="Describe this island in a few words" dir="auto" value={data.description} />
        </label>
      </div>
    );
  }
}

LevelEditor = connect(state => ({
  auth: state.auth
}))(LevelEditor);
LevelEditor = translate()(LevelEditor);
export default LevelEditor;
