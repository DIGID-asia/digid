const DIGIDToken = artifacts.require("DIGIDToken");

module.exports = function(deployer) {
  deployer.deploy(DIGIDToken);
};
