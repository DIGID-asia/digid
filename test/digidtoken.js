const DIGIDToken = artifacts.require("DIGIDToken");

contract("DIGIDToken", accounts => {
  let owner = accounts[0];
  let acc1 = accounts[1];
  let acc2 = accounts[2];
  let acc3 = accounts[3];
  let acc4 = accounts[4];

  const toWei = web3.utils.toWei;
  var digid;

  beforeEach(async () => {
    digid = await DIGIDToken.deployed();
  });

  it("should enable transfer", async () => {
    assert.equal(
      true,
      await digid.isTransferAllowed(),
      "Transfer should be allowed"
    );
  });

  it("should have the right token name and symbol", async () => {
    let name = await digid.name();
    let symbol = await digid.symbol();

    assert.equal("DIGID Token", name, "Symbol should be DIGID Token");
    assert.equal("DIGID", symbol, "Symbol should be DIGID");
  });

  it("should rename the token name and symbol", async () => {
    var name = await digid.name();
    var symbol = await digid.symbol();
    assert.equal("DIGID Token", name, "Symbol should be DIGID Token");
    assert.equal("DIGID", symbol, "Symbol should be DIGID");

    await digid.renameToken("FOO", "FOO Token");
    var name = await digid.name();
    var symbol = await digid.symbol();

    assert.equal("FOO Token", name, "Symbol should be FOO Token");
    assert.equal("FOO", symbol, "Symbol should be FOO");
  });

  it("should have a max supply of 1714285714", async () => {
    let ms = await digid.maxSupply();
    let ts = await digid.totalSupply();

    assert.equal(
      1714285714 * 10 ** 18,
      ms,
      // toWei("1714285714", "ether"),
      "Max supply should be 1714285714"
    );
    assert.equal(0 * 10 ** 18, ts, "Max supply should be 0");
  });

  it("should increase the supply for another 1b", async () => {
    assert.equal(
      1714285714 * 10 ** 18,
      await digid.maxSupply(),
      "Max supply should be 1714285714"
    );

    // increase another 1b
    await digid.increaseSupply(toWei("1000000000", "ether"));

    assert.equal(
      2714285714 * 10 ** 18,
      await digid.maxSupply(),
      "Max supply should be 1714285714"
    );
  });

  it("mint beyond 2b limit", async () => {
    assert.equal(
      2714285714 * 10 ** 18,
      await digid.maxSupply(),
      "Max supply should be 1714285714"
    );

    // mint 3b DIGID
    try {
      await digid.mint(acc1, toWei("3714285714", "ether"));
    } catch (e) {
      assert.equal(
        2714285714 * 10 ** 18,
        await digid.maxSupply(),
        "Max supply should be 1714285714"
      );
    }
  });

  it("should mint 1000 DIGID to acc1", async () => {
    // check acc1 balance first
    var acc1Balance = await digid.balanceOf(acc1);
    assert.equal(0 * 10 ** 18, acc1Balance, "Should be zero for now");

    // mint 1,000 DIGID to acc1
    await digid.mint(acc1, toWei("1000", "ether"));
    var acc1Balance = await digid.balanceOf(acc1);
    assert.equal(1000 * 10 ** 18, acc1Balance, "Should be 1000 for now");
  });

  it("should be able to transfer 200 DIGID to acc2", async () => {
    // allow the transfers first
    await digid.allowTransfers();

    // Check the balance first
    var acc1Balance = await digid.balanceOf(acc1);
    assert.equal(1000 * 10 ** 18, acc1Balance, "Should be 1000 for now");

    // transfer to acc2
    await digid.transfer(acc2, toWei("200", "ether"), { from: acc1 });
    var acc2Balance = await digid.balanceOf(acc2);
    assert.equal(200 * 10 ** 18, acc2Balance, "Should be 200 by now");

    // check for acc2
    var acc1Balance = await digid.balanceOf(acc1);
    assert.equal(800 * 10 ** 18, acc1Balance, "Should be 800 for now");
  });

  it("acc2 should have 200 DIGID, and cannot transfer to acc3", async () => {
    var acc2Balance = await digid.balanceOf(acc2);
    assert.equal(200 * 10 ** 18, acc2Balance, "Should be 200 by now");

    // lock acc2
    await digid.lockAddress(acc2);

    // try to transfer to acc3
    try {
      await digid.transfer(acc3, toWei("100", "ether"), { from: acc2 });
    } catch (e) {
      // above should fail.
      assert.equal(
        200 * 10 ** 18,
        await digid.balanceOf(acc2),
        "Should be 200 again"
      );
      assert.equal(
        0 * 10 ** 18,
        await digid.balanceOf(acc3),
        "Should be 0 again"
      );
    }
  });

  it("acc2 can now transfer to acc3", async () => {
    await digid.unlockAddress(acc2, { from: owner });
    await digid.transfer(acc3, toWei("100", "ether"), { from: acc2 });
    assert.equal(
      100 * 10 ** 18,
      await digid.balanceOf(acc2),
      "Should be 200 again"
    );
    assert.equal(
      100 * 10 ** 18,
      await digid.balanceOf(acc3),
      "Should be 0 again"
    );
  });

  it("burn the amount in acc3", async () => {
    var ts = await digid.totalSupply();
    assert.equal(1000 * 10 ** 18, ts, "Should be 1,000");

    // burn acc3
    await digid.burn(acc3, toWei("100", "ether"), { from: owner });
    assert.equal(0 * 10 ** 18, await digid.balanceOf(acc3), "Should be 0 again");
  });

  it("total supply should be 900", async () => {
    // total supply should reduce
    var ts1 = await digid.totalSupply();
    assert.equal(900 * 10 ** 18, ts1, "total supply should be 900");
  });

  it("Mint and lock acc4, and acc4 should not be able to transfer", async () => {
    // mint to acc4
    await digid.mintThenLock(acc4, toWei("2000", "ether"));
    // await digid.lockAddress(acc4);

    assert.equal(
      2900 * 10 ** 18,
      await digid.totalSupply(),
      "total supply should be 2900"
    );

    assert.equal(
      2000 * 10 ** 18,
      await digid.balanceOf(acc4),
      "Should be 2000 for now"
    );

    // try to send out
    try {
      assert.equal(
        100 * 10 ** 18,
        await digid.balanceOf(acc2),
        "Should be 200 again"
      );

      await digid.transfer(acc2, toWei("100", "ether"), { from: acc4 });
    } catch (e) {
      assert.equal(
        2000 * 10 ** 18,
        await digid.balanceOf(acc4),
        "Should still be 2000 for now"
      );

      // ok, now unlock
      await digid.unlockAddress(acc4);
      await digid.transfer(acc2, toWei("100", "ether"), { from: acc4 });

      assert.equal(
        200 * 10 ** 18,
        await digid.balanceOf(acc2),
        "acc2 should be 300 by now"
      );

      assert.equal(
        1900 * 10 ** 18,
        await digid.balanceOf(acc4),
        "Should be 1900 for now"
      );
    }
  });

  // transfer ownership to acc1, and mint to acc2 for 300
  it("should transfer ownership to acc1, and mint acc2 for 300", async () => {
    await digid.transferOwnership(acc1, { from: owner });

    // acc1 mint acc2 for 300;
    assert.equal(
      200 * 10 ** 18,
      await digid.balanceOf(acc2),
      "acc2 should be 200"
    );

    // mint 200 for acc2
    await digid.mint(acc2, toWei("200", "ether"), { from: acc1 });

    assert.equal(
      400 * 10 ** 18,
      await digid.balanceOf(acc2),
      "acc2 should be 400 by now"
    );
  });
});
