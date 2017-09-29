"use strict";

var $ = require("jquery"),
    fx = require("animation/fx"),
    positionUtils = require("animation/position"),
    holdEvent = require("events/hold"),
    pointerMock = require("../../helpers/pointerMock.js");

require("common.css!");
require("ui/action_sheet");

QUnit.testStart(function() {
    var markup =
        '<div id="container">\
            <div id="actionSheet"></div>\
        </div>\
        \
        <div id="widget"></div>';

    $("#qunit-fixture").html(markup);
});

var ACTION_SHEET_WITHOUT_TITLE_CLASS = "dx-actionsheet-without-title";

QUnit.module("action sheet", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        fx.off = true;

        this.element = $($("#actionSheet").dxActionSheet());
        this.instance = this.element.dxActionSheet("instance");
        this.instance.show();
        this.instance.hide();
    },
    afterEach: function() {
        fx.off = false;
        this.clock.restore();
    }
});

QUnit.test("render popup", function(assert) {
    var popupElement = $(".dx-popup", this.element),
        popup = popupElement.dxPopup("instance"),
        popupPosition = popup.option("position");

    assert.ok(popupElement.length, "Popup rendered");
    assert.ok(popupElement.dxPopup("instance"));

    assert.equal(popupPosition.my, "bottom");
    assert.equal(popupPosition.at, "bottom");
    assert.strictEqual(popupPosition.of, window);


    assert.equal(popup.option("width"), "100%");
    assert.equal(popup.option("height"), "auto");
});

QUnit.test("popup is not draggable", function(assert) {
    var $overlayContent = $(".dx-overlay-content");

    assert.ok(!$overlayContent.hasClass("dx-popup-draggable"), "is not draggable");
});

QUnit.test("popup position (B252842)", function(assert) {
    assert.expect(1);

    var $popup = $(".dx-popup", this.element),
        $overlayContent = $(".dx-overlay-content", $popup),
        popup = $popup.dxPopup("instance"),
        positionConfig = popup.option("position");

    this.instance.show().done(function() {
        var expectedPosition = positionUtils.calculate($overlayContent, positionConfig).v.location;

        assert.equal($overlayContent.position().top, expectedPosition, "correct position of overlay content element");
    });
});

QUnit.test("Resize by option", function(assert) {
    var setUpWidth = 11,
        setUpHeight = 22,
        increment = 123,
        $actionSheet = $("#actionSheet").dxActionSheet({
            items: [{ text: "items 1" }],
            itemTemplate: $("<div />"),
            visible: true,
            width: setUpWidth,
            height: setUpHeight
        }),
        initialWidth = $actionSheet.width(),
        initialHeight = $actionSheet.height(),
        actionSheet = $actionSheet.dxActionSheet("instance"),
        popup = actionSheet._popup;

    assert.notEqual(setUpWidth, initialWidth, "Width init does NOT effect element itself");
    assert.notEqual(setUpHeight, initialHeight, "Height init does NOT effect element itself");

    assert.deepEqual({
        w: setUpWidth,
        h: setUpHeight
    }, {
        w: popup.option("width"),
        h: popup.option("height")
    }, "Popup's size was inited correctly");

    actionSheet.option("width", setUpWidth + increment);
    actionSheet.option("height", setUpHeight + increment);

    assert.deepEqual({
        w: initialWidth,
        h: initialHeight
    }, {
        w: $actionSheet.width(),
        h: $actionSheet.height()
    }, "Resize does NOT effect element itself");

    assert.deepEqual({
        w: popup.option("width"),
        h: popup.option("height")
    }, {
        w: setUpWidth + increment,
        h: setUpHeight + increment
    }, "Popup's size changed properly");
});

QUnit.test("render cancel", function(assert) {
    var popup = $(".dx-popup", this.element).dxPopup("instance");

    this.instance.option("showCancelButton", true);
    var cancelButton = $(".dx-actionsheet-cancel", popup.content());
    assert.ok(cancelButton.dxButton("instance") && cancelButton.length, "Cancel button was rendered in popup content");

    this.instance.option("showCancelButton", false);
    cancelButton = $(".dx-actionsheet-cancel", popup.content());
    assert.ok(!cancelButton.length, "Cancel button was removed from popup content");
});

QUnit.test("render 'onCancelClick'", function(assert) {
    var cancelActionFired = 0,
        secondCancelActionFired = 0,
        $actionSheet = $("#actionSheet").dxActionSheet({
            items: [{ text: "items 1" }],
            visible: true,
            onCancelClick: function() {
                cancelActionFired++;
            }
        }),
        actionSheet = $actionSheet.dxActionSheet("instance");

    actionSheet.show();
    $(".dx-actionsheet-cancel").trigger("dxclick");
    assert.equal(cancelActionFired, 1, "cancelClick was rendered on init");

    actionSheet.option("onCancelClick", function() {
        secondCancelActionFired++;
    });

    actionSheet.show();
    $(".dx-actionsheet-cancel").trigger("dxclick");
    assert.equal(secondCancelActionFired, 1, "cancelClick was rendered on option change");
});

QUnit.test("show and hide methods are provided to popup", function(assert) {
    assert.expect(5);

    var popup = $(".dx-popup", this.element).dxPopup("instance"),
        instance = this.instance;

    assert.equal(popup.option("visible"), false, "hidden on init");

    this.instance.show().done(function() {
        assert.strictEqual(this, instance);
    });

    assert.equal(popup.option("visible"), true, "show()");

    this.instance.hide().done(function() {
        assert.strictEqual(this, instance);
    });

    assert.equal(popup.option("visible"), false, "hide()");
});

QUnit.test("cancel button click hides popup", function(assert) {
    var $cancelButton = $(".dx-actionsheet-cancel", this.element),
        popup = $(".dx-popup", this.element).dxPopup("instance");

    this.instance.show();
    assert.equal(popup.option("visible"), true, "shown before click");

    $($cancelButton).trigger("dxclick");
    assert.equal(popup.option("visible"), false, "hides on click");
});

QUnit.test("render items", function(assert) {
    var clickedAction = 0,
        items = [
            {
                text: "Action 1",
                onClick: function() {
                    clickedAction = 1;
                },
                type: "danger"
            },
            {
                text: "Action 2",
                onClick: function() {
                    clickedAction = 2;
                },
                disabled: true
            }
        ],
        itemElements,
        first,
        second;

    this.instance.option("items", items);
    this.instance.show();
    itemElements = $(".dx-actionsheet-item", $($(".dx-popup", this.element).dxPopup("instance").content()));
    assert.equal(itemElements.length, 2, "correct items count");

    first = itemElements.find(".dx-button").eq(0);
    assert.equal(first.dxButton("instance").option("text"), items[0].text, "correct item text");
    assert.equal(first.dxButton("instance").option("type"), items[0].type, "correct item type");

    first.trigger("dxclick");
    assert.equal(clickedAction, 1, "correct item click handler");

    second = itemElements.find(".dx-button").eq(-1);
    assert.ok(second.dxButton("instance").option("disabled"), "correct item disabled state");

    // NOTE: B233186
    assert.equal($(".dx-actionsheet-cancel").length, 1, "there is only one 'cancel' button");
});

QUnit.test("'onItemHold' should be fired after hold (T106668)", function(assert) {
    assert.expect(2);

    var $actionSheet = $("#actionSheet").dxActionSheet({
            items: [{ text: "text" }],
            onItemHold: function() {
                assert.ok(true, "action fired");
            }
        }),
        actionSheet = $actionSheet.dxActionSheet("instance");

    actionSheet.show();

    $(actionSheet.itemElements()).eq(0).trigger(holdEvent.name);
    assert.equal(actionSheet.option("visible"), false, "closed after hold");
});

QUnit.test("title option", function(assert) {
    var popup = $(".dx-popup", this.element).dxPopup("instance");

    assert.equal(popup.option("title"), "", "default value");

    this.instance.option("title", "Another title");
    assert.equal(popup.option("title"), "Another title", "new value set");
});

QUnit.test("showTitle option", function(assert) {
    this.instance.show();
    var $popupTitle = $(".dx-popup-title"),
        $popup = $(".dx-popup-wrapper");

    assert.ok($popupTitle.is(":visible"), "visible by default");
    assert.ok(!$popup.hasClass(ACTION_SHEET_WITHOUT_TITLE_CLASS), "class set");

    this.instance.option("showTitle", false);
    assert.ok(!$popupTitle.is(":visible"), "hidden");
    assert.ok($popup.hasClass(ACTION_SHEET_WITHOUT_TITLE_CLASS), "class removed");
});

QUnit.test("cancelText option", function(assert) {
    var cancelButton = $(".dx-actionsheet-cancel", this.element).dxButton("instance");
    assert.equal(cancelButton.option("text"), "Cancel", "default value");

    this.instance.option("cancelText", "Another cancel text");

    cancelButton = $(".dx-actionsheet-cancel", this.element).dxButton("instance");
    assert.equal(cancelButton.option("text"), "Another cancel text", "new value set");
});

QUnit.test("regression: B233733 dxActionSheet: popup hides on render", function(assert) {
    var items = [
        {
            text: "Action 1"
        },
        {
            text: "Action 2"
        }
    ];

    this.instance.show();
    this.instance.option("items", items);

    var popup = this.instance.$element().find(".dx-popup").dxPopup("instance");

    assert.ok(popup.option("visible"), "popup is shown after items change");
    assert.equal(popup.content().text(), ["Action 1", "Action 2", "Cancel"].join(""), "popup refreshed after items change");
});

QUnit.test("regression: B233570 Menu isn't hidden after click on action", function(assert) {
    var items = [
        {
            text: "Action 1"
        },
        {
            text: "Action 2",
            disabled: true
        }
        ],
        itemElements,
        first,
        second;

    this.instance.option("items", items);
    this.instance.show();

    itemElements = $(".dx-actionsheet-item", $($(".dx-popup", this.element).dxPopup("instance").content()));
    first = itemElements.first();
    second = itemElements.last();

    var popup = this.element.find(".dx-popup").dxPopup("instance");

    this.instance.show();
    first.trigger("dxclick");
    assert.ok(!popup.option("visible"), "popup hides after click");

    this.instance.show();
    second.trigger("dxclick");
    assert.ok(popup.option("visible"), "popup not hides if button is disabled");
});

QUnit.test("popup toggling on option 'visible' change", function(assert) {
    assert.expect(4);

    var popup = $(".dx-popup", this.element).dxPopup("instance");

    assert.equal(popup.option("visible"), false, "hidden on init");

    this.instance.option("visible", true);
    assert.equal(popup.option("visible"), true, "shown");

    this.instance.option("visible", false);
    assert.equal(popup.option("visible"), false, "hidden");

    var anotherActionSheet = $("<div/>").appendTo($("#container"));
    anotherActionSheet.dxActionSheet({ visible: true });
    assert.equal($(".dx-popup", anotherActionSheet).dxPopup("instance").option("visible"), true, "shown on init");

    anotherActionSheet.remove();
});

QUnit.test("items rendered correctly after changing items and showing (Q570978)", function(assert) {
    var $actionSheet = $("<div>").dxActionSheet({}).appendTo("#qunit-fixture"),
        actionSheet = $actionSheet.dxActionSheet("instance");

    actionSheet.option("items", [{ text: "1" }, { text: "2" }, { text: "3" }]);
    actionSheet.option("visible", true);
    assert.equal($(".dx-actionsheet-item").length, 3, "three items rendered");
});

QUnit.test("disabled", function(assert) {
    var executed = 0,
        items = [
            {
                text: "Action 1",
                click: function() {
                    executed++;
                }
            }
        ],
        $button;

    this.instance.option("items", items);
    $button = this.element.find(".dx-actionsheet-item").eq(0);

    this.instance.option("disabled", true);
    this.instance.show();
    pointerMock($button).start().click();
    assert.equal(executed, 0, "popup not hides if it is disabled");
});

QUnit.test("initialized with disabled state widget should not be disabled at all (popup)", function(assert) {
    var $actionSheet = $("#actionSheet").dxActionSheet({
        disabled: true,
        items: [1, 2, 3],
        usePopover: false,
        visible: true
    });

    $actionSheet.dxActionSheet("option", "disabled", false);
    assert.equal($(".dx-actionsheet-popup-wrapper .dx-state-disabled").length, 0, "widget enabled");
});

QUnit.test("initialized with disabled state widget should not be disabled at all (popover)", function(assert) {
    var $actionSheet = $("#actionSheet").dxActionSheet({
        disabled: true,
        items: [1, 2, 3],
        usePopover: true,
        target: "body",
        visible: true
    });

    $actionSheet.dxActionSheet("option", "disabled", false);
    assert.equal($(".dx-actionsheet-popover-wrapper .dx-state-disabled").length, 0, "widget enabled");
});

QUnit.test("'visible' option", function(assert) {
    this.instance.show();
    var $cancelButton = this.element.find("dx-button");
    $($cancelButton).trigger("dxclick");
    assert.ok(this.instance.option("visible"), false);
});

QUnit.test("visible option should be updated if was changed in popup (Q571157)", function(assert) {
    this.instance.option("visible", true);
    this.instance._popup.option("visible", false);
    assert.equal(this.instance.option("visible"), false);
});

QUnit.module("popover integration", {
    beforeEach: function() {
        fx.off = true;
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        fx.off = false;
        this.clock.restore();
    }
});

QUnit.test("usePopover without target creates Popup", function(assert) {
    var $actionSheet = $("#actionSheet").dxActionSheet({
        usePopover: true
    });

    $actionSheet.dxActionSheet("option", "visible", true);
    var $popup = $actionSheet.find(".dx-popup");
    assert.equal($popup.length, 1, "popup was created");
});

QUnit.test("usePopover with target creates Popover", function(assert) {
    var $container = $("#container");
    var $actionSheet = $("#actionSheet").dxActionSheet({
        usePopover: true,
        target: $container
    });

    $actionSheet.dxActionSheet("option", "visible", true);

    var $popover = $(".dx-popover"),
        $target = $($popover.dxPopover("option", "target"));

    assert.equal($popover.length, 1, "popover was created");
    assert.equal($target.get(0), $container.get(0), "popover target is element");
    assert.equal($(".dx-actionsheet-popup-wrapper").length, 0, "no popup-related css class");
    assert.equal($(".dx-actionsheet-popover-wrapper").length, 1, "popover-related css class added");
    assert.equal($(".dx-actionsheet-cancel").length, 0, "no cancel button");
});


QUnit.test("usePopover option change", function(assert) {
    var $container = $("#container");
    var actionSheet = $("#actionSheet").dxActionSheet({
        usePopover: false,
        target: $container
    }).dxActionSheet("instance");

    assert.equal($(".dx-popover").length, 0, "popover is not selected");

    actionSheet.option("usePopover", true);
    assert.equal($(".dx-popover").length, 1, "popover is selected");

    actionSheet.option("usePopover", false);
    assert.equal($(".dx-popover").length, 0, "popover is not selected");
});


QUnit.test("outside click fires cancel", function(assert) {
    var $actionSheet = $("#actionSheet").dxActionSheet({
        usePopover: true,
        target: $("#container")
    });

    $actionSheet.dxActionSheet("show");

    pointerMock($("#qunit-fixture"))
        .start()
        .wait(500)
        .click();

    var $popover = $("#container").find(".dx-overlay-content");

    assert.ok($popover.is(":hidden"), "popover is hidden");

    $actionSheet.dxActionSheet("show");

    assert.ok($popover.is(":visible"), "popover is visible");
});

QUnit.module();

QUnit.test("Forward templates to popup", function(assert) {
    var $actionSheet = $("#actionSheet")
        .append($("<div />")
        .attr("data-options", "dxTemplate : { name: 'title' }"));

    $actionSheet.dxActionSheet();

    var actionSheet = $actionSheet.dxActionSheet("instance"),
        templates = actionSheet.option("integrationOptions.templates"),
        popupTemplates = actionSheet._popup.option("integrationOptions.templates");

    var noOneTemplateIsMissing = true;

    $.each(templates, function(key) {
        if(popupTemplates[key]) return;
        noOneTemplateIsMissing = false;
    });

    assert.ok(noOneTemplateIsMissing, "Templates were forwarded");
});

QUnit.module("regressions", {
    beforeEach: function() {
        fx.off = true;
    },
    afterEach: function() {
        fx.off = false;
    }
});

QUnit.test("Q463379 - dxActionSheet adds duplicated items when they are added at runtime (13.2 Beta)", function(assert) {
    var items = [
        {
            text: "Action 1"
        },
        {
            text: "Action 2"
        }
        ],
        $actionSheet = $("#actionSheet"),
        $itemElements;

    $actionSheet.dxActionSheet({ items: items });
    $actionSheet.dxActionSheet("show");
    $actionSheet.dxActionSheet("option", "items", items);

    $itemElements = $(".dx-actionsheet-item", $(".dx-popup", $actionSheet).dxPopup("instance").content());
    assert.equal($itemElements.length, 2, "correct items count");
});

QUnit.test("fails when using custom itemTemplate or itemRender (B253839)", function(assert) {
    var $actionSheet = $("#actionSheet").dxActionSheet({
        items: [{ text: "item 1" }],
        itemTemplate: $("<div />"),
        visible: true
    });

    $($actionSheet.find(".dx-actionsheet-item")).trigger("dxclick");
    assert.expect(0);
});


QUnit.module("widget sizing render");

QUnit.test("default", function(assert) {
    var $element = $("#widget").dxActionSheet(),
        instance = $element.dxActionSheet("instance");

    instance.show();

    assert.ok(instance._popup._container().outerWidth() > 0, "outer width of the element must be more than zero");
});

QUnit.test("constructor", function(assert) {
    var $element = $("#widget").dxActionSheet({ width: 400 }),
        instance = $element.dxActionSheet("instance");

    instance.show();

    assert.strictEqual(instance.option("width"), 400);
    assert.strictEqual(instance._popup._container().outerWidth(), 400, "outer width of the element must be equal to custom width");
});

QUnit.test("change width", function(assert) {
    var $element = $("#widget").dxActionSheet(),
        instance = $element.dxActionSheet("instance"),
        customWidth = 400;

    instance.option("width", customWidth);

    instance.show();
    assert.strictEqual(instance._popup._container().outerWidth(), customWidth, "outer width of the element must be equal to custom width");
});
