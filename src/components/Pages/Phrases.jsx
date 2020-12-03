import React, { Component } from "react";
import { connect } from "react-redux";
import { UnmuteIcon, MuteIcon } from "@primer/octicons-react";

import { getPhrases } from "../../actions/phrasesAct";
import { gStorageAudioPath } from "../../constants/paths";
import { buildHTMLElement, furiganaParse } from "../../helper/parser";

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

class Phrases extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      showRomaji: false,
    };

    this.props.getPhrases();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
  }

  componentDidMount() {}

  componentDidUpdate() {
    // console.log("phrases.jsx");
    // console.log(this.state);
  }

  gotoNext() {
    const l = this.props.phrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  gotoPrev() {
    const l = this.props.phrases.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  render() {
    // TODO: cleanup
    if (!this.props.phrases || this.props.phrases.length < 1) return <div />;

    const phrase = this.props.phrases[this.state.selectedIndex];

    let japanesePhrase;

    if (phrase.japanese.indexOf("\n") === -1) {
      japanesePhrase = <div>{phrase.japanese}</div>;
    } else {
      try {
        const { kanjis, furiganas, nonKanjis, startsWHiragana } = furiganaParse(
          phrase.japanese
        );
        japanesePhrase = buildHTMLElement(
          kanjis,
          furiganas,
          nonKanjis,
          startsWHiragana
        );
      } catch (e) {
        console.error(e);
        japanesePhrase = (
          <div style={{ color: "red" }}>
            {phrase.japanese.split("\n").map((p) => (
              <div>{p}</div>
            ))}
          </div>
        );
      }
    }

    return (
      <div className="phrases" style={{ height: "75%" }}>
        <div
          className="d-flex justify-content-between"
          style={{ height: "100%" }}
        >
          <button
            type="button"
            className="btn btn-success"
            onClick={this.gotoPrev}
          >
            prev
          </button>
          <div className="pt-3 d-flex flex-column justify-content-around text-center">
            <h1>{japanesePhrase}</h1>
            <h2
              onClick={() => {
                this.setState((state) => ({ showRomaji: !state.showRomaji }));
              }}
              className="clickable"
            >
              {this.state.showRomaji ? phrase.romaji : "[romaji]"}
            </h2>
            <div
              onClick={() => {
                this.setState((state) => ({ showMeaning: !state.showMeaning }));
              }}
              className="clickable"
            >
              {this.state.showMeaning ? phrase.english : "[english]"}
            </div>
            {phrase.uid ? (
              <div
                className="d-flex justify-content-center clickable"
                onClick={() => {
                  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p
                  this.player.src = gStorageAudioPath + phrase.uid + ".mp3";
                  this.player.play();
                }}
              >
                <audio ref={(ref) => (this.player = ref)} />
                <UnmuteIcon size="medium" aria-label="pronunciation" />
              </div>
            ) : (
              <div
                className="d-flex justify-content-center"
                style={{ color: "lightgray" }}
              >
                <MuteIcon size="medium"></MuteIcon>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-success"
            onClick={this.gotoNext}
          >
            next
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { phrases: state.phrases.value };
};

export default connect(mapStateToProps, { getPhrases })(Phrases);

export { PhrasesMeta };
