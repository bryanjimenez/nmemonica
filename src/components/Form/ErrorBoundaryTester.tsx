import PropTypes from "prop-types";


  {/* <ErrorBoundaryTester
    when={this.state.selectedIndex ===2}
    what={()=>{
        // @ts-expect-error Error.cause
        throw new Error("testing", {cause:{code:"InvalidPronunciation"}})
  }}/> */}

  interface ErrorBoundaryTesterProps {
     when: boolean,
     what: Function,
  }

export function ErrorBoundaryTester(props:ErrorBoundaryTesterProps) {
  if(props.when){
    props.what();
  }
  return <span>ErrorBoundaryTester</span>;
}

ErrorBoundaryTester.propTypes = {
  when: PropTypes.bool,
  what: PropTypes.func,
};
