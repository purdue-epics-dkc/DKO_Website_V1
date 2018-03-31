$(document).ready(function () {
    $('.node').click(function (event) {
        var $e = $(this),
            $childrenWrapper = $e.find('.childrenWrapper'),
            $children = $e.find('.children'),
            h = $e.is('.expanded') ? 0 : $children.height(); // target height depending on it being expanded or not.
        $childrenWrapper.height(h); // applying height (see css transition on .node > .childrenWrapper)
        $(this).toggleClass('expanded');
    });
});
