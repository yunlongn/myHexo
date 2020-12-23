const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');
class TagCloud extends Component {
    render() {
        const { tags } = this.props;
        const name = "tagcloud";
        console.log(tags)
        return <Fragment>
            <div className="card widget" data-type="tagscloud"
                 style="transition: opacity 0.3s ease-out 0s, transform 0.3s ease-out 0s; opacity: 1; transform-origin: center top;">
                <div className="card-content" id="tags">
                    <h3 className="menu-label">标签云</h3>
                    {tags.map(tag => {
                        return <a href={tag.url}>{tag.name} </a>;
                    })}
                </div>
                <script src="/js/tagcloud.js"></script>
            </div>
        </Fragment>;
    }
}
TagCloud.Cacheable = cacheComponent(TagCloud, 'widget.tagcloud', function (props) {
    var helper = props.helper,
        _props$orderBy = props.orderBy,
        orderBy = _props$orderBy === void 0 ? 'name' : _props$orderBy,
        _props$order = props.order,
        order = _props$order === void 0 ? 1 : _props$order,
        amount = props.amount,
        _props$showCount = props.showCount,
        showCount = _props$showCount === void 0 ? true : _props$showCount;
    var tags = props.tags || props.site.tags;
    var url_for = helper.url_for,
        _p = helper._p;

    if (!tags || !tags.length) {
        return null;
    }

    tags = tags.sort(orderBy, order).filter(function (tag) {
        return tag.length;
    });

    if (amount) {
        tags = tags.limit(amount);
    }

    return {
        showCount: showCount,
        title: _p('common.tag', Infinity),
        tags: tags.map(function (tag) {
            return {
                name: tag.name,
                count: tag.length,
                url: url_for(tag.path)
            };
        })
    };
});
module.exports = TagCloud;
