var xmlrpc = require('xmlrpc'),
    Q = require('q'),
    moment = require('moment');

function Maventa(vendorApiKey, apiKey, companyUuid, testing) {
  this.vendorApiKey = vendorApiKey;
  this.apiKey = apiKey;
  this.companyUuid = companyUuid;
  this.testing = !!testing;
  this.apiUrl = this.testing ? 'testing.maventa.com' : 'secure.maventa.com';

};

Maventa.prototype.getClient = function() {
  return this.client || (this.client = xmlrpc.createSecureClient({ host: this.apiUrl, port: 443, path: '/apis/denver/api'}));
};


Maventa.prototype.helloWorld = function() {
  var cl = this.getClient();
  var defer = Q.defer();
  cl.methodCall('hello_world', [], function(err, value) {
    if (err) return defer.reject(err);
    defer.resolve(value);
  });
  return defer.promise;
};

Maventa.prototype.callAuthenticatedAction = function(action) {
  var defer = Q.defer(),
      cl = this.getClient(),
      parms = [{
        vendor_api_key: this.vendorApiKey,
        user_api_key: this.apiKey,
        company_uuid: this.companyUuid
      }].concat(Array.prototype.slice.call(arguments, 1));
  cl.methodCall(action, parms, function(err, value) {
    if (err) return defer.reject(err);
    if (value.length && value[0].status && value[0].status.indexOf('ERROR:') === 0) {
      return defer.reject(new Error(value[0].status));
    }
    defer.resolve(value);
  });
  return defer.promise;
};

Maventa.prototype.companyShow = function() {
  return this.callAuthenticatedAction('company_show');
};

Maventa.prototype.invoiceListInboundBetweenDates = function(start, end) {
  return this.callAuthenticatedAction('invoice_list_inbound_between_dates', formatMaventaDateTime(start), formatMaventaDateTime(end));
};

module.exports = Maventa;

//Utils
function formatMaventaDateTime(d) {
  return moment(d).format('YYYYMMDDHHmmss');
};

