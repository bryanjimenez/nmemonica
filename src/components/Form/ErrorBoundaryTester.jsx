import React from "react";
import PropTypes from "prop-types";


  {/* <ErrorBoundaryTester
    when={this.state.selectedIndex ===2}
    what={()=>{
        // @ts-expect-error Error.cause
        throw new Error("testing", {cause:{code:"InvalidPronunciation"}})
  }}/> */}

/**
 * @typedef {{
 * when: boolean,
 * what: function,
 * }} ErrorBoundaryTesterProps
 * @param {ErrorBoundaryTesterProps} props
 */
export function ErrorBoundaryTester(props) {
  if(props.when){
    props.what();
  }
  return <span>ErrorBoundaryTester</span>;
}

ErrorBoundaryTester.propTypes = {
  when: PropTypes.bool,
  what: PropTypes.func,
};
