/* eslint-disable */


{
  /* <ErrorBoundaryTester
    when={this.state.selectedIndex ===2}
    what={()=>{
        
        throw new Error("testing", {cause:{code:"InvalidPronunciation"}})
  }}/> */
}

interface ErrorBoundaryTesterProps {
  when: boolean;
  what: Function;
}

export function ErrorBoundaryTester(props: ErrorBoundaryTesterProps) {
  if (props.when) {
    props.what();
  }
  return <span>ErrorBoundaryTester</span>;
}
