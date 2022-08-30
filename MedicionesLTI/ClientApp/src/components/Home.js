import * as React from "react";

export class Home extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const { children } = this.props;

        return (
            <div className="relativeCSS">
                <style type="text/css" media="print">
                    {"\
   @page { size: landscape; }\
"}
                </style>
                {children}
            </div>
        );
    }
}
                

export const HomeToPrint = React.forwardRef((props, ref) => {
    // eslint-disable-line max-len
    return <Home ref={ref} children={props.children} />;
});