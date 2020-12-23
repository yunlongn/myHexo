const { Component, Fragment } = require('inferno');

module.exports = class extends Component {
    render() {

        return <Fragment>
            <script src="https://static.codepen.io/assets/common/stopExecutionOnTimeout-de7e2ef6bfefd24b79a3f68b414b87b8db5b08439cac3f1012092b2290c719cd.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.8.0/p5.min.js"></script>
            <script src="/js/rendered.js"></script>
        </Fragment>;
    }
};
