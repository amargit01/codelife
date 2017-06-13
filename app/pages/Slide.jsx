import React, {Component} from "react";
import {translate} from "react-i18next";
import {Link} from "react-router";
import Nav from "components/Nav";

class Slide extends Component {

  render() {
    
    const {t} = this.props;

    const {trid, tid, lid, sid} = this.props.params;

    // todo - have slideArray come from json-in-the-sky, using id to cherrypick
    const slideArray = [
      {
        sid: "slide-1",
        title: "slide 1",
        content: "i am the content of slide 1"
      },
      {
        sid: "slide-2",
        title: "slide 2",
        content: "i am the content of slide 2"
      },
      {
        sid: "slide-3",
        title: "slide 3",
        content: "i am the content of slide 3"
      },
      {
        sid: "slide-4",
        title: "slide 4",
        content: "i am the content of slide 4"
      }
    ];
    
    const currentSid = parseInt(sid.split("-")[1], 10);
    const currentSlide = slideArray[currentSid - 1];
    const prevSlideSlug = `slide-${currentSid - 1}`;
    const nextSlideSlug = `slide-${currentSid + 1}`;

    return (
      <div>
        <h1>{trid}: {tid}: {lid}: { t(currentSlide.title) }</h1>
        <p>{currentSlide.content}</p>
        { currentSid > 1 ? <Link className="link" to={`/track/${trid}/${tid}/${lid}/${prevSlideSlug}`}>previous</Link> : <span>previous</span> }
        &nbsp;&nbsp;&nbsp;
        { currentSid < slideArray.length ? <Link className="link" to={`/track/${trid}/${tid}/${lid}/${nextSlideSlug}`}>next</Link> : <span>next</span> } 
        <br/><br/>
        <Link className="link" to={`/track/${trid}/${tid}`}>return to {tid}</Link><br/>
        <Link className="link" to={`/track/${trid}`}>return to {trid}</Link>
        <br/><br/>
        <Nav />
      </div>
    );
  }
}

export default translate()(Slide);