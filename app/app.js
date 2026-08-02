window.tab_bool = false;
let mode = "stores",
  orderNumber;
window.customExists = true;
//Order detailed attribute
let orderAttr = [
  "paidAmount",
  "netTotal",
  "orderDate&Time",
  "prepaidAmount",
  "shippingDate&Time",
  "shippingCostsGross",
  "shippingCostsNet",
  "vatTotal",
  "billingAddress",
  "ownerId",
  "plentyId",
  "name",
  "onStockAvailability",
  "outOfStockAvailability",
  "storageLocationType",
  "storageLocationZone",
  "OrderLine.discount",
  "OrderLine.exchangeRate",
  "OrderLine.priceGross",
  "OrderLine.priceNet",
  "OrderLine.priceOriginalNet",
  "OrderLine.priceOriginalGross",
  "OrderLine.purchasePrice",
  "OrderLine.surcharge",
  "OrderLine.vatRate",
  "OrderLine.number",
  "OrderLine.packingUnits",
  "OrderLine.weightG",
  "OrderLine.warehouseId",
  "OrderLine.itemletiationId",
  "OrderLine.shippingProfileId",
];

const mapProp = {
  billingAddress: [
    "name1",
    "name2",
    "name3",
    "address1",
    "address2",
    "address3",
    "town",
    "postalCode",
  ],
};

// ---------------------------------------------------------------------------
// Platform 3.0 authentication / request-template helpers
// (Replaces the old app.js -> server.js -> lib/api.js -> Shopware/PlentyMarkets
//  flow. All HTTP calls now go straight from the front end to the request
//  templates declared in config/requests.json via client.request.invokeTemplate())
// ---------------------------------------------------------------------------

let authToken = null;

// function login() {
//   return client.request
//     .invokeTemplate("login", {
//       body: JSON.stringify({
//         username: iparam.client_id,
//         password: iparam.client_secret,
//       }),
//     })

//     .then(function (data) {
//       // Parse the response exactly as you did before
//       let auth = JSON.parse(data.response);
//       authToken = auth.token_type + " " + auth.access_token;
//       return authToken;
//     })
//     .catch(function (error) {
//       console.error("Error during login:", error);
//       throw error;
//     });
// }

function login() {
  return client.iparams
    .get()
    .then(function (iparams) {
      return client.request.invokeTemplate("login", {
        body: JSON.stringify({
          username: iparams.client_id,
          password: iparams.client_secret,
        }),
      });
    })
    .then(function (data) {
      let auth = JSON.parse(data.response);
      authToken = auth.token_type + " " + auth.access_token;
      return authToken;
    })
    .catch(function (error) {
      console.error("Error during login:", error);
      throw error;
    });
}

function ensureAuthToken() {
  if (authToken) {
    return Promise.resolve(authToken);
  }
  return login();
}

// Invokes a request template, automatically attaching the auth token and
// silently re-authenticating once if the token has expired.
function invokeWithAuth(templateName, context) {
  return ensureAuthToken().then(function (token) {
    let ctx = Object.assign({ token: token }, context || {});

    return client.request
      .invokeTemplate(templateName, { context: ctx })
      .catch(function (err) {
        let status =
          err && (err.status || (err.response && err.response.status));
        if (status === 401 || status === 419) {
          authToken = null;
          return login().then(function (newToken) {
            let retryCtx = Object.assign({ token: newToken }, context || {});
            return client.request.invokeTemplate(templateName, {
              context: retryCtx,
            });
          });
        }
        throw err;
      });
  });
}

document.onreadystatechange = function () {
  if (document.readyState === "interactive") renderApp();

  function renderApp() {
    let onInit = app.initialized();

    onInit.then(getClient).catch(handleErr);

    function getClient(_client) {
      window.client = _client;

      loadAppConfig();

      // client.events.on("app.activated", onAppActivate);
    }
  }
};

// function loadAppConfig() {
//   console.log("loadapp");

//   waitingForRes();
//   client.iparams
//     .get()
//     .then((data) => {
//       let target = data;

//       if (target != "") {
//         console.log("loadtarget", target);
//         oauthConfig();
//         loadStores(target);
//       }
//     })
//     .catch((err) => {
//       console.log("loaderr", err);

//       client.interface.trigger("showNotify", {
//         type: "danger",
//         title: "Error",
//         message: err,
//       });
//     });

//   //fetch
//   client.iparams
//     .get("properties")
//     .then((prop) => {
//       window.list_out_prop = Array.isArray(prop.properties.order_p)
//         ? prop.properties.order_p
//         : [];

//       let order_p = Array.isArray(prop.properties.order_p)
//         ? prop.properties.order_p.filter((e) => !orderAttr.includes(e.key))
//         : [];

//       if (order_p.length != 0) {
//         orderAttr = orderAttr.concat(order_p.map((e) => e.key));
//       }
//       window.list_item_prop = Array.isArray(prop.properties.item_p)
//         ? prop.properties.item_p
//         : [];

//       let item_p = Array.isArray(prop.properties.item_p)
//         ? prop.properties.item_p.filter(
//             (e) => !orderAttr.includes("OrderLine." + e.key),
//           )
//         : [];

//       if (item_p.length != 0) {
//         orderAttr = orderAttr.concat(item_p.map((e) => "OrderLine." + e.key));
//       }
//     })
//     .catch((err) => {
//       client.interface.trigger("showNotify", {
//         type: "danger",
//         title: "Error",
//         message: err,
//       });
//     });
// }

function loadAppConfig() {
  console.log("loadapp");
  waitingForRes();

  Promise.all([client.iparams.get(), client.iparams.get("properties")])
    .then(([data, prop]) => {
      window.list_out_prop = Array.isArray(prop.properties.order_p)
        ? prop.properties.order_p
        : [];

      let order_p = Array.isArray(prop.properties.order_p)
        ? prop.properties.order_p.filter((e) => !orderAttr.includes(e.key))
        : [];
      if (order_p.length != 0) {
        orderAttr = orderAttr.concat(order_p.map((e) => e.key));
      }

      window.list_item_prop = Array.isArray(prop.properties.item_p)
        ? prop.properties.item_p
        : [];

      let item_p = Array.isArray(prop.properties.item_p)
        ? prop.properties.item_p.filter(
            (e) => !orderAttr.includes("OrderLine." + e.key)
          )
        : [];
      if (item_p.length != 0) {
        orderAttr = orderAttr.concat(item_p.map((e) => "OrderLine." + e.key));
      }

      let target = data;
      if (target != "") {
        console.log("loadtarget", target);
        oauthConfig();
        loadStores(target);
      }
    })
    .catch((err) => {
      console.log("loaderr", err);
      client.interface.trigger("showNotify", {
        type: "danger",
        title: "Error",
        message: err,
      });
    });
}

function loadStores(target) {
  document.getElementById("stock-yes").style.display = "none";
  document.getElementById("rma-yes").style.display = "none";
  document.getElementById("show-ship-spin").style.display = "none";
  let store_div = document.getElementById("store-name");

  while (store_div.childNodes.length > 0) {
    store_div.removeChild(store_div.childNodes[0]);
  }

  let multiple_stores = document.createElement("fw-input");
  multiple_stores.setAttribute("label", "Store Name");
  multiple_stores.setAttribute("id", "Orderid");
  multiple_stores.setAttribute("readonly", "");
  multiple_stores.setAttribute("value", target.SWdomain);

  store_div.appendChild(multiple_stores);
}

// function oauthConfig() {
//   console.log("oauthconfig");

//   login()
//     .then(function () {
//       return client.data.get("ticket");
//     })
//     .then(function (data_) {
//       let fetchData = data_;
//       console.log("fetch", fetchData);

//       getWorkitem(fetchData);
//     })
//     .catch(function (err) {
//       console.log("oauthconfigerror",err);

//       client.interface.trigger("showNotify", {
//         type: "danger",
//         title: "",
//         message: err.message
//           ? err.message
//           : "OOPS issue or Invalid Credentials",
//       });
//     });
// }
function oauthConfig() {
  console.log("oauthconfig");

  return login()
    .then(function () {
      return client.data.get("ticket");
    })
    .then(function (data_) {
      let fetchData = data_;
      console.log("fetch", fetchData);

      // Ensure getWorkitem returns its promise so errors propagate
      return getWorkitem(fetchData);
    })
    .catch(function (err) {
      console.log("oauthconfigerror", err);

      client.interface.trigger("showNotify", {
        type: "danger",
        title: "",
        message: err.message
          ? err.message
          : "OOPS issue or Invalid Credentials",
      });
    });
}

function getWorkitem(fetchData) {
  invokeWithAuth("getWorkitem", {
    senderEmail: fetchData.ticket.sender_email,
  }).then(
    function (data) {
      let order = JSON.parse(data.response);
      if (order.entries == "") {
        window.tab_bool = true;
        window.customExists = false;

        noUserdet();
      } else {
        bindOrderInDropdown(order);
      }
    },
    function (err) {
      // err is a json object with requestID, status and message.
      client.interface.trigger("showNotify", {
        type: "danger",
        title: "Error",
        message: err.message
          ? err.message
          : "OOPS issue or Invalid Credentials",
      });
    },
  );
}

function getorderNumberItems(value) {
  orderNumber = value;
  if (value) {
    document.getElementById("order-yes").style.display = "none";
    document.getElementById("stock-yes").style.display = "none";
    document.getElementById("show-ship-spin").style.display = "block";
    document.getElementById("show-spin").style.display = "none";
  } else {
    document.getElementById("show-spin").style.display = "none";
    document.getElementById("order-yes").style.display = "none";
    document.getElementById("stock-yes").style.display = "none";
  }
  return new Promise(function (resolve, reject) {
    invokeWithAuth("getOrderNumberItems", { orderID: value }).then(
      function (data) {
        let resp = JSON.parse(data.response);
        if (resp.entries.length != 0) {
          getlineItemsInCard(resp);

          // resp is get order
          yesOrderDet();

          //disable spin
          document.getElementById("show-ship-spin").style.display = "none";

          resolve(resp);
        } else {
          reject(resp);
        }
      },
      function (err) {
        reject(err);
      },
    );
  });
}

/* eslint-disable-next-line no-unused-vars */
function searchOrderbyID() {
  document.getElementById("show-spin").style.display = "block";
  orderNumber = document.getElementById("ordersearch").value;

  if (orderNumber) {
    document.getElementById("order-yes").style.display = "none";
    document.getElementById("stock-yes").style.display = "none";
  } else {
    document.getElementById("show-spin").style.display = "none";
    document.getElementById("order-yes").style.display = "none";
    document.getElementById("stock-yes").style.display = "none";
  }

  if (document.getElementById("ordersearch").value == "") {
    client.interface.trigger("showNotify", {
      type: "danger",
      title: "",
      message: "Enter a valid Order ID",
    });
  } else {
    return new Promise(function (resolve, reject) {
      invokeWithAuth("getOrderNumberItems", { orderID: orderNumber })
        .then(function (data) {
          let resp = JSON.parse(data.response);
          console.log(resp.entries);

          if (resp.entries.length != 0) {
            window.tab_bool = false;
            getlineItemsInCard(resp);
            yesOrderDet();
            resolve(resp.entries);
          } else {
            reject(resp.entries);
            window.tab_bool = true;
            client.interface.trigger("showNotify", {
              type: "danger",
              title: "",
              message:
                "Order ID does not exist. Please enter a valid Order ID.",
            });
          }

          document.getElementById("show-spin").style.display = "none";
        })
        .catch((err) => {
          document.getElementById("show-spin").style.display = "none";
          reject(err.message);
        });
    });
  }
}

function noUserdet() {
  client.instance.resize({ height: "400px" });
  document.getElementById("user-no").style.display = "block";
  document.getElementById("customerNotExists").style.display = "block";
  document.getElementById("user-yes").style.display = "none";
  document.getElementById("show-spin").style.display = "none";
  document.getElementById("order-list").style.display = "none";
}

function yesOrderDet() {
  client.instance.resize({ height: "700px" });
  document.getElementById("user-yes").style.display = "block";
  document.getElementById("customerNotExists").style.display = "none";
  document.getElementById("show-spin").style.display = "none";
  document.getElementById("order-yes").style.display = "block";
  document.getElementById("show-ship-spin").style.display = "none";
  if (mode == "stock") {
    document.getElementById("user-yes-tab").style.display = "none";
    document.getElementById("stock-yes").style.display = "block";
    document.getElementById("rma-yes").style.display = "none";
  } else {
    document.getElementById("customerNotExists").style.display = "none";
    document.getElementById("rma-yes").style.display = "none";
    document.getElementById("stock-yes").style.display = "none";
    document.getElementById("show-ship-spin").style.display = "none";
  }
}

function waitingForRes() {
  //spin until the order open
  document.getElementById("customerNotExists").style.display = "none";
  document.getElementById("show-spin").style.display = "block";
  document.getElementById("user-yes").style.display = "none";
  document.getElementById("rma-yes").style.display = "none";
  document.getElementById("stock-yes").style.display = "none";
  document.getElementById("user-no").style.display = "none";
  document.getElementById("invalid-cred").style.display = "none";
  document.getElementById("show-ship-spin").style.display = "none";
}

function bindOrderInDropdown(order) {
  client.instance.resize({ height: "300px" });
  let order_l_div = document.getElementById("order-list");

  while (order_l_div.childNodes.length > 0) {
    order_l_div.removeChild(order_l_div.childNodes[0]);
  }

  let create_o = document.createElement("fw-select"),
    o_option;
  create_o.setAttribute("id", "order_list_options");

  for (let i = 0; i < order.entries.length; i++) {
    o_option = document.createElement("fw-select-option");
    o_option.setAttribute("value", order.entries[i].id);

    if (order.entries[0].id == order.entries[i].id) {
      o_option.setAttribute("selected", "selected");
    }

    o_option.innerHTML = order.entries[i].id;
    create_o.appendChild(o_option);
  }

  getorderNumberItems(order.entries[0].id);

  if (order.entries.length != 0) {
    create_o.setAttribute("placeholder", "Your orders");
    create_o.setAttribute("label", "Order ID");

    order_l_div.appendChild(create_o);
    create_o.addEventListener("fwChange", (e) => {
      getorderNumberItems(e.detail.value);
    });
  }
}

//************************card details function showing**************************
function getlineItemsInCard(resp) {
  console.log("orderItems:", JSON.stringify(resp.entries[0].orderItems, null, 2));
console.log("relations:", JSON.stringify(resp.entries[0].relations, null, 2));
  console.log("order items:", resp.entries[0].orderItems);
  let item_card = document.getElementById("item_card_id");

  while (item_card.childNodes.length > 0) {
    item_card.removeChild(item_card.childNodes[0]);
  }
  let spinner = document.createElement("fw-spinner");
  spinner.setAttribute("style", "text-align:center");
  spinner.setAttribute("color", "green");
  item_card.appendChild(spinner);

  //stock details
  let stock_orders_id = document.getElementById("stock_orders_id");

  while (stock_orders_id.childNodes.length > 0) {
    stock_orders_id.removeChild(stock_orders_id.childNodes[0]);
  }
  spinner = document.createElement("fw-spinner");
  spinner.setAttribute("style", "text-align:center");
  spinner.setAttribute("color", "green");
  stock_orders_id.appendChild(spinner);
  //end stock detail

  document.getElementById("order-yes").style.display = "block";
  //Recent order
  orderItemsCard(resp);

  //More order details
  bindOrderDetails(resp);

  //Rma tab
  //display customer shipping address

  displayshippingAddress(resp);
}

function bindOrderDetails(order_info) {
  //add attr neto order link address
  client.iparams
    .get("SWdomain")
    .then((param) => {
      let sw_store = document.getElementById("neto_store_id");
      sw_store.setAttribute(
        "href",
        `https://${param.SWdomain}/plenty/terra/order/order-search`,
      );
      sw_store.setAttribute("target", "_blank");
      //bind link of order details page

      //bind order attribute
      bindOrderAttr(order_info);
    })
    .catch((err) => {
      client.interface.trigger("showNotify", {
        type: "danger",
        title: "Error",
        message: err,
      });
    });
}

function bindOrderAttr(data1) {
  let more_order_det = document.getElementById("more-order-details");

  let attr_element = document.getElementById("order-prop");

  let order_prop = window.list_out_prop ? window.list_out_prop : [];

  if (order_prop.length != 0) {
    more_order_det.style.display = "block";

    while (attr_element.childNodes.length > 0) {
      attr_element.removeChild(attr_element.childNodes[0]);
    }
  }

  let parentdiv = document.createElement("div"),
    div2,
    map_prop_h;

  parentdiv.setAttribute("class", "fw-content-list");

  for (let i = 0; i < order_prop.length; i++) {
    div2 = document.createElement("div");

    div2.setAttribute("class", "muted prop-place-holder");

    if (order_prop[i]["name"] == "Order Date& Time") {
      div2.innerHTML = "Order Date&Time" + ": ";
    } else if (order_prop[i]["name"] == "Shipping Date& Time") {
      div2.innerHTML = "Shipping Date&Time" + ": ";
    } else {
      div2.innerHTML = order_prop[i]["name"] + ": ";
    }
    parentdiv.appendChild(div2);
    map_prop_h = mapProp[order_prop[i]["key"]];
    let itemattr = bindItemAttrValue(data1, map_prop_h, order_prop, i);
    parentdiv.appendChild(itemattr);

    attr_element.appendChild(parentdiv);
  }
}

const inValidValue = [undefined, null, ""];

function bindItemAttrValue(data1, map_prop_h, order_prop, i) {
  let data2 = data1.entries[0];
  let shipp = data2["dates"].find((a) => {
    return a.typeId === 8;
  });
  let div3 = document.createElement("div"),
    parentdiv = document.createElement("div");

  if (map_prop_h && Array.isArray(map_prop_h)) {
    for (let j = 0; j < map_prop_h.length; j++) {
      div3 = document.createElement("div");
      if (data2["addresses"][0][map_prop_h[j]]) {
        div3.innerText = data2["addresses"][0][map_prop_h[j]];
      } else {
        div3.innerHTML = "Nil";
      }
      parentdiv.appendChild(div3);
    }
  } else {
    if (!inValidValue.includes(data2[order_prop[i]["key"]])) {
      div3.innerHTML = data2[order_prop[i]["key"]];
    } else if (order_prop[i]["key"] == "plentyID") {
      div3.innerHTML = data2["plentyId"];
    } else if (order_prop[i]["key"] == "ownerID") {
      div3.innerHTML = data2["ownerId"];
    } else if (data2["amounts"][0][order_prop[i]["key"]]) {
      div3.innerHTML = data2["amounts"][0][order_prop[i]["key"]];
    } else if (data2["warehouseSender"][order_prop[i]["key"]]) {
      div3.innerHTML = data2["warehouseSender"][order_prop[i]["key"]];
    } else if (order_prop[i]["key"] == "orderDate&Time") {
      div3.innerHTML = data2["createdAt"];
    } else if (order_prop[i]["key"] == "shippingDate&time" && shipp) {
      div3.innerHTML = shipp["date"];
    } else {
      div3.innerHTML = "Nil";
    }

    parentdiv.appendChild(div3);
  }

  return parentdiv;
}

function orderItemsCard(resp) {
  //loop iterate for order items

  let item_card = document.getElementById("item_card_id");

  while (item_card.childNodes.length > 0) {
    item_card.removeChild(item_card.childNodes[0]);
  }
  let li,
    div,
    itemCardElement = [];
  let items = resp.entries[0];
  let removeItems = items.orderItems;

  const shippingIndex = removeItems.findIndex(
    (a) => a.orderItemName === "Shipping costs",
  );

  if (shippingIndex !== -1) {
    removeItems.splice(shippingIndex, 1);
  }
  for (let i = 0; i < items.orderItems.length; i++) {
    itemCardElement.push(
      tableCardBind(items["orderItems"][i], true, false, items),
    );
  }

  let spinner = document.createElement("fw-spinner");
  spinner.setAttribute("style", "text-align:center");
  spinner.setAttribute("color", "green");
  item_card.appendChild(spinner);

  Promise.all(itemCardElement)
    .then((data) => {
      while (item_card.childNodes.length > 0) {
        item_card.removeChild(item_card.childNodes[0]);
      }
      for (let i = 0; i < data.length; i++) {
        ({ li, div } = elementCreate("li", "div"));

        li.setAttribute("class", "list-group-item");
        div.setAttribute("class", "padd-r-l");
        div.appendChild(data[i]);
        li.appendChild(div);

        item_card.appendChild(li);
      }

      ({ li, div } = elementCreate("li", "div"));
      li.setAttribute("class", "list-group-item");
      div.setAttribute("class", "padd-r-l");

      tableCardBind(null, true, true, items)
        .then((endCard) => {
          div.appendChild(endCard);
          li.appendChild(div);
          item_card.appendChild(li);
        })
        .catch((err) => {
          client.interface.trigger("showNotify", {
            type: "danger",
            title: "Error",
            message: err.message
              ? err.message
              : "OOPS issue or Invalid Credentials",
          });
        });
    })
    .catch((err) => {
      client.interface.trigger("showNotify", {
        type: "danger",
        title: "Error",
        message: err.message
          ? err.message
          : "OOPS issue or Invalid Credentials",
      });
    });
}

/**
Item card list function bind
**/
function elementCreate(...el) {
  let el_obj = el;

  return {
    tr: el_obj.includes("tr") ? document.createElement("tr") : "",
    td: el_obj.includes("td") ? document.createElement("td") : "",
    b: el_obj.includes("b") ? document.createElement("b") : "",
    h5: el_obj.includes("h5") ? document.createElement("h5") : "",
    h6: el_obj.includes("h6") ? document.createElement("h6") : "",
    li: el_obj.includes("li") ? document.createElement("li") : "",
    div: el_obj.includes("div") ? document.createElement("div") : "",
    fwlabel1: el_obj.includes("fwlabel1")
      ? document.createElement("fw-label")
      : "",
    fwlabel2: el_obj.includes("fwlabel2") ? document.createElement("div") : "",
  };
}

function tableCardBind(obj, o_name, last, items) {
  let table = document.createElement("table"),
    parentdiv = document.createElement("div"),
    tr,
    td,
    b;
  if (!last) {
    //Image
    return new Promise(function (resolve) {
      if (obj) {
        //item name bind
        ({ tr, td } = elementCreate("tr", "td"));

        td.setAttribute("colspan", "2");
        let table11 = document.createElement("table");
        table11.setAttribute("style", "width:100%");
        let tr11 = document.createElement("tr");

        let td12 = document.createElement("td");
        let table1 = document.createElement("table");
        let tr1 = document.createElement("tr");
        let td1 = document.createElement("td");
        td1.innerHTML = "<b>" + obj.orderItemName + "</b>";
        tr1.appendChild(td1);
        table1.appendChild(tr1);
        let tr2 = document.createElement("tr");
        let td2 = document.createElement("td");
        td2.innerHTML = "Quantity: " + "<b>" + obj.quantity + "</b>";
        tr2.appendChild(td2);
        table1.appendChild(tr2);
        let tr44 = document.createElement("tr");
        let td44 = document.createElement("td");

        td44.innerHTML =
          "Unit Price: " +
          "<b>" +
          obj.amounts[0].currency +
          " " +
          parseFloat(obj.amounts[0].priceGross).toFixed(2) +
          "</b>";

        tr44.appendChild(td44);
        table1.appendChild(tr44);

        td12.appendChild(table1);
        tr11.appendChild(td12);
        table11.appendChild(tr11);

        td.appendChild(table11);
        tr.appendChild(td);
        table.appendChild(tr);
      }

      parentdiv.setAttribute("class", "fw-content-list");

      ({ tr, td } = elementCreate("tr", "td"));

      td.setAttribute("colspan", "2");

      //Inside table data
      let item_card_attr = itemCardAttr(obj);
      td.appendChild(item_card_attr);
      tr.appendChild(td);
      table.appendChild(tr);

      //item price bind and with action
      //item name bind
      ({ tr, td, b } = elementCreate("tr", "td", "b"));
      td.setAttribute("class", "text-align-end table-td");
      td.setAttribute("style", "padding: 5px;");
      td.setAttribute("style", "width:100%");
      b.innerHTML =
        (
          parseFloat(obj.amounts[0].priceGross) * parseFloat(obj.quantity)
        ).toFixed(2) +
        " " +
        obj.amounts[0].currency; //window.currency_type;
      td.appendChild(b);
      tr.appendChild(td);

      table.appendChild(tr);

      resolve(table);
    });
  } else {
    return new Promise(function (resolve) {
      ({ tr, td, h5, h6, b } = elementCreate("tr", "td", "h5", "h6", "b"));
      h6.setAttribute("style", "margin-top:1px");
      h6.innerHTML = "<b>" + "Total" + "</b>";
      td.appendChild(h6);
      td.appendChild(h5);
      tr.appendChild(td);

      if (o_name) {
        ({ td } = elementCreate("td"));
        td.setAttribute("class", "text-align-end table-td");
        td.setAttribute("style", "padding: 1px;");
        b.innerHTML =
          items.amounts[0].invoiceTotal + " " + items.amounts[0].currency;
        h5.appendChild(b);
        td.appendChild(h5);
        tr.appendChild(td);
      }
      table.appendChild(tr);

      let payment = items["properties"].find((a) => {
        return a.typeId === 4;
      });
      if (payment != "") {
        let paymentStatus =
          payment.value.charAt(0).toUpperCase() + payment.value.slice(1);
        ({ tr, td, h5, h6, b } = elementCreate("tr", "td", "h5", "h6", "b"));

        h6.setAttribute("style", "margin-top:1px");

        b.innerHTML = "Payment Status";
        h5.appendChild(b);
        td.appendChild(h5);
        tr.appendChild(td);

        let fwlabel1;
        ({ td, fwlabel1 } = elementCreate("td", "fwlabel1"));
        td.setAttribute("class", "text-align-end table-td");
        td.setAttribute("style", "text-align: end;");
        // td.setAttribute('style', 'width: 100px;');
        fwlabel1.setAttribute("color", "green");
        fwlabel1.setAttribute("value", paymentStatus);
        td.appendChild(fwlabel1);
        tr.appendChild(td);
        table.appendChild(tr);
      }

      ({ tr, td, h5, h6, b } = elementCreate("tr", "td", "h5", "h6", "b"));
      h6.setAttribute("style", "margin-top:1px");
      b.innerHTML = "Order Status";
      h5.appendChild(b);
      td.appendChild(h5);
      tr.appendChild(td);

      if (items.statusName == "Canceled" || items.statusName == "Retrun") {
        let fwlabel2;
        ({ td, fwlabel2 } = elementCreate("td", "fwlabel2"));
        td.setAttribute("class", "text-align-end table-td");
        fwlabel2.setAttribute("class", "cut-text");
        fwlabel2.innerHTML = items.statusName; // +`<span class="tooltiptext">${items.statusName}</span>`
        td.appendChild(fwlabel2);
        tr.appendChild(td);
        table.appendChild(tr);
      } else if (
        items.statusName == "Incomplete data" ||
        items.statusName == "Order exported"
      ) {
        let fwlabel2;
        ({ td, fwlabel2 } = elementCreate("td", "fwlabel2"));
        td.setAttribute("class", "text-align-end table-td");
        fwlabel2.setAttribute("class", "cut-text");
        let span1 = document.createElement("span");
        span1.setAttribute("class", "tooltiptext");
        span1.setAttribute("style", "width:220px;");
        span1.setAttribute("style", "left:60%;");
        span1.innerHTML = items.statusName;
        fwlabel2.innerHTML = items.statusName; // +`<span class="tooltiptext">${items.statusName}</span>`
        fwlabel2.appendChild(span1);
        td.appendChild(fwlabel2);
        tr.appendChild(td);
        table.appendChild(tr);
      } else if (
        items.statusName == "Waiting for return from wholesale dealer" ||
        items.statusName == "Ready for shipping; waiting for payment"
      ) {
        let fwlabel2;
        ({ td, fwlabel2 } = elementCreate("td", "fwlabel2"));
        td.setAttribute("class", "text-align-end table-td");
        fwlabel2.setAttribute("class", "cut-text");
        let span1 = document.createElement("span");
        span1.setAttribute("class", "tooltiptext");
        span1.setAttribute("style", "width:225px;");
        span1.setAttribute("style", "left:35%;");
        span1.innerHTML = items.statusName;
        fwlabel2.innerHTML = items.statusName; // +`<span class="tooltiptext">${items.statusName}</span>`
        fwlabel2.appendChild(span1);
        td.appendChild(fwlabel2);
        tr.appendChild(td);
        table.appendChild(tr);
      } else {
        let fwlabel2;
        ({ td, fwlabel2 } = elementCreate("td", "fwlabel2"));
        td.setAttribute("class", "text-align-end table-td");
        fwlabel2.setAttribute("class", "cut-text");
        let span1 = document.createElement("span");
        span1.setAttribute("class", "tooltiptext");
        span1.setAttribute("style", "width:200px;");
        span1.setAttribute("style", "left:40%;");
        span1.innerHTML = items.statusName;
        fwlabel2.innerHTML = items.statusName; // +`<span class="tooltiptext">${items.statusName}</span>`
        fwlabel2.appendChild(span1);
        td.appendChild(fwlabel2);
        tr.appendChild(td);
        table.appendChild(tr);
      }
      resolve(table);
    });
  }
}

function itemCardAttr(obj) {
  let data4 = obj.amounts[0];
  // let data5 = obj.letiation;
  let data5 = obj.letiation || obj.variation || {};
  //iterate object attr
  let parentdiv = document.createElement("div"),
    div2; //, div3;

  let item_prop = window.list_item_prop ? window.list_item_prop : [];

  let table = document.createElement("table");

  for (let j = 0; j < item_prop.length; j++) {
    ({ tr, td } = elementCreate("tr", "td"));
    td.setAttribute("class", "table-td1");
    div2 = document.createElement("div");

    let val_attr = obj[item_prop[j].key];
    let ship_meth = data4[item_prop[j].key];
    let pay_attr = data5[item_prop[j].key];

    if (ship_meth) {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 10px;'>: " +
        ship_meth +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    } else if (pay_attr) {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 10px;'>: " +
        pay_attr +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    } else if (item_prop[j].key == "itemletiationID") {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;padding-top: 6px;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 6px;'>: " +
        obj["itemletiationId"] +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    } else if (item_prop[j].key == "warehouseID") {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;padding-top: 6px;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 6px;'>: " +
        obj["warehouseId"] +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    } else if (item_prop[j].key == "shippingProfileID") {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;padding-top: 6px;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 6px;'>: " +
        obj["shippingProfileId"] +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    } else if (val_attr) {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;padding-top: 6px;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 6px;'>: " +
        val_attr +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    } else {
      div2.innerHTML =
        "<label style='color:#75a3a3;font-weight: 200;float:left;padding-top: 6px;'>" +
        item_prop[j].name +
        "</label>" +
        "<label class='lab' style='color: black;padding-top: 6px;'>: " +
        "Nil" +
        "</label>";
      td.appendChild(div2);
      tr.appendChild(td);
      table.appendChild(tr);
    }
    parentdiv.appendChild(table);
  }
  return parentdiv;
}

// function displayshippingAddress(resp) {
//   console.log("Full order response:", resp.entries[0]);
//   console.log("addresses:", resp.entries[0].addresses);
//   console.log("addressRelations:", resp.entries[0].addressRelations);
//   const shipRelations = resp.entries[0].addressRelations || [];
//   const shipRelation =
//     shipRelations.find((r) => r.typeId === 2) || shipRelations[0] || {};
//   const shipAddr = shipRelation.address || shipRelation;
//   client.instance.resize({ height: "400px" });

//   let stock_orders_id = document.getElementById("stock_orders_id");
//   let table = document.createElement("table"),
//     tr,
//     td;

//   while (stock_orders_id.childNodes.length > 0) {
//     stock_orders_id.removeChild(stock_orders_id.childNodes[0]);
//   }

//   //item name bind
//   ({ tr, td } = elementCreate("tr", "td"));

//   td.setAttribute("colspan", "2");
//   let table11 = document.createElement("table");
//   table11.setAttribute("style", "width:100%");
//   let tr11 = document.createElement("tr");

//   let td12 = document.createElement("td");
//   let table1 = document.createElement("table");
//   let tr1_ = document.createElement("tr");
//   let td1_ = document.createElement("td");
//   td1_.setAttribute("style", "padding: 20px 0px 5px;");
//   let b1_ = document.createElement("b");
//   b1_.setAttribute("class", "b");
//   b1_.innerText = shipAddr.name11;
//   td1_.innerHTML = "Company: ";
//   td1_.appendChild(b1_);
//   tr1_.appendChild(td1_);
//   table1.appendChild(tr1_);
//   let tr1 = document.createElement("tr");
//   let td1 = document.createElement("td");
//   td1.setAttribute("style", "padding: 20px 0px 5px;");
//   let b9_ = document.createElement("b");
//   b9_.setAttribute("class", "b");
//   b9_.innerText = shipAddr.name12;
//   td1.innerHTML = "First Name: ";
//   td1.appendChild(b9_);
//   tr1.appendChild(td1);
//   table1.appendChild(tr1);
//   let tr2 = document.createElement("tr");
//   let td2 = document.createElement("td");
//   td2.setAttribute("style", "padding: 20px 0px 5px;");
//   let b2_ = document.createElement("b");
//   b2_.setAttribute("class", "b");
//   b2_.innerText = shipAddr.name13;
//   td2.innerHTML = "Last Name: ";
//   td2.appendChild(b2_);
//   tr2.appendChild(td2);
//   table1.appendChild(tr2);
//   let tr44 = document.createElement("tr");
//   let td44 = document.createElement("td");
//   td44.setAttribute("style", "padding: 20px 0px 10px;");
//   let b3_ = document.createElement("b");
//   b3_.setAttribute("class", "b");
//   b3_.innerText = resp.entries[0].addresses[1].address1;
//   td44.innerHTML = "Address 1: ";
//   td44.appendChild(b3_);
//   tr44.appendChild(td44);
//   table1.appendChild(tr44);
//   if (resp.entries[0].addresses[1].address2 !== null) {
//     let tr45 = document.createElement("tr");
//     let td45 = document.createElement("td");
//     td45.setAttribute("style", "padding: 20px 0px 10px;");
//     let b4_ = document.createElement("b");
//     b4_.setAttribute("class", "b");
//     b4_.innerText = resp.entries[0].addresses[1].address2;
//     td45.innerHTML = "Address 2: ";
//     td45.appendChild(b4_);
//     tr45.appendChild(td45);
//     table1.appendChild(tr45);
//     let tr49 = document.createElement("tr");
//     let td49 = document.createElement("td");
//     td49.setAttribute("style", "padding: 20px 0px 10px;");
//     let b5_ = document.createElement("b");
//     b5_.setAttribute("class", "b");
//     b5_.innerText = resp.entries[0].addresses[1].address3;
//     td49.innerHTML = "Address 3: ";
//     td49.appendChild(b5_);
//     tr49.appendChild(td49);
//     table1.appendChild(tr49);
//   } else {
//     let tr45 = document.createElement("tr");
//     let td45 = document.createElement("td");
//     td45.setAttribute("style", "padding: 20px 0px;");
//     td45.innerHTML = "Address 2: " + "<b>" + "" + "</b>";
//     tr45.appendChild(td45);
//     table1.appendChild(tr45);
//     let tr49 = document.createElement("tr");
//     let td49 = document.createElement("td");
//     td49.setAttribute("style", "padding: 20px 0px;");
//     td49.innerHTML = "Address 3: " + "<b>" + "" + "</b>";
//     tr49.appendChild(td49);
//     table1.appendChild(tr49);
//   }
//   let tr46 = document.createElement("tr");
//   let td46 = document.createElement("td");
//   td46.setAttribute("style", "padding: 20px 0px 5px;");
//   let b6_ = document.createElement("b");
//   b6_.setAttribute("class", "b");
//   b6_.innerText = resp.entries[0].addresses[1].town;
//   td46.innerHTML = "Town: ";
//   td46.appendChild(b6_);
//   tr46.appendChild(td46);
//   table1.appendChild(tr46);
//   let tr47 = document.createElement("tr");
//   let td47 = document.createElement("td");
//   td47.setAttribute("style", "padding: 20px 0px 5px;");
//   let b7_ = document.createElement("b");
//   b7_.setAttribute("class", "b");
//   b7_.innerText = resp.entries[0].addresses[1].postalCode;
//   td47.innerHTML = "Zip Code: ";
//   td47.appendChild(b7_);
//   tr47.appendChild(td47);
//   table1.appendChild(tr47);
//   let tr48 = document.createElement("tr");
//   let td48 = document.createElement("td");
//   td48.setAttribute("style", "padding: 20px 0px 5px;");
//   let b8_ = document.createElement("b");
//   b8_.setAttribute("class", "b");
//   b8_.innerText = resp.entries[0].location.name;
//   td48.innerHTML = "Country: ";
//   td48.appendChild(b8_);
//   tr48.appendChild(td48);
//   table1.appendChild(tr48);

//   td12.appendChild(table1);
//   tr11.appendChild(td12);
//   table11.appendChild(tr11);
//   td.appendChild(table11);
//   tr.appendChild(td);
//   table.appendChild(tr);

//   stock_orders_id.appendChild(table);
// }

// function onAppActivate() {
//   let textElement = document.getElementById("apptext");
//   let getContact = client.data.get("contact");
//   getContact.then(showContact).catch(handleErr);

//   function showContact(payload) {
//     textElement.innerHTML = `Ticket created by ${payload.contact.name}`;
//   }
// }

function displayshippingAddress(resp) {
  const order = resp.entries[0];
  const addressRelations = order.addressRelations || [];
  const shipRelation = addressRelations.find((r) => r.typeId === 2);
  const contactRelation = (order.relations || []).find(
    (r) => r.referenceType === "contact",
  );

  client.instance.resize({ height: "400px" });

  let stock_orders_id = document.getElementById("stock_orders_id");
  while (stock_orders_id.childNodes.length > 0) {
    stock_orders_id.removeChild(stock_orders_id.childNodes[0]);
  }

  if (!shipRelation || !contactRelation) {
    stock_orders_id.innerHTML =
      "<p>No shipping address found for this order.</p>";
    return;
  }

  invokeWithAuth("getContactAddress", {
    contactID: contactRelation.referenceId,
    addressID: shipRelation.addressId,
  })
    .then(function (data) {
      const shipAddr = JSON.parse(data.response);
      renderShippingAddress(shipAddr, order);
    })
    .catch(function (err) {
      console.error("Could not load shipping address:", err);
      stock_orders_id.innerHTML = "<p>Could not load shipping address.</p>";
    });
}

function renderShippingAddress(shipAddr, order) {
  let stock_orders_id = document.getElementById("stock_orders_id");
  while (stock_orders_id.childNodes.length > 0) {
    stock_orders_id.removeChild(stock_orders_id.childNodes[0]);
  }

  let table = document.createElement("table");
  let table1 = document.createElement("table");

  const rows = [
    ["Company: ", shipAddr.name1],
    ["First Name: ", shipAddr.name2],
    ["Last Name: ", shipAddr.name3],
    ["Address 1: ", shipAddr.address1],
    ["Address 2: ", shipAddr.address2],
    ["Address 3: ", shipAddr.address3],
    ["Town: ", shipAddr.town],
    ["Zip Code: ", shipAddr.postalCode],
    ["Country: ", order.location ? order.location.name : ""],
  ];

  rows.forEach(([label, value]) => {
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.setAttribute("style", "padding: 20px 0px 5px;");
    let b = document.createElement("b");
    b.setAttribute("class", "b");
    b.innerText = value || "Nil";
    td.innerHTML = label;
    td.appendChild(b);
    tr.appendChild(td);
    table1.appendChild(tr);
  });

  let td12 = document.createElement("td");
  td12.appendChild(table1);
  let tr11 = document.createElement("tr");
  tr11.appendChild(td12);
  let table11 = document.createElement("table");
  table11.setAttribute("style", "width:100%");
  table11.appendChild(tr11);

  let outerTr = document.createElement("tr");
  let outerTd = document.createElement("td");
  outerTd.setAttribute("colspan", "2");
  outerTd.appendChild(table11);
  outerTr.appendChild(outerTd);
  table.appendChild(outerTr);

  stock_orders_id.appendChild(table);
}

function handleErr(err) {
  console.error(`Error occured. Details:`, err);
}
