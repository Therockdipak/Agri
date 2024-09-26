const {ethers} = require("hardhat");
const {expect} = require("chai");

describe("AgriMarketplace", async ()=>{
  let agriMarketplace;
  let government;
  let farmer;
  let buyer;
  let verifier;

   beforeEach(async ()=> {
    [government,farmer,buyer,verifier] = await ethers.getSigners();

     agriMarketplace = await ethers.deployContract("AgriMarketplace",[]);
     console.log(await agriMarketplace.getAddress());
   });

    it("should set right owner", async ()=> {
      expect(await agriMarketplace.Government()).to.equal(government.address);
    });

    describe("MSPUpdate", async ()=> {
      it("should allow government to update MSP", async ()=> {
         const newMSP = ethers.parseUnits("100",18);
         await agriMarketplace.MSPUpdate("rice",newMSP);
        //  update msp 
        const updateMSP = await agriMarketplace.MSPforProduct("rice");
         expect(await updateMSP).to.equal(newMSP);
      });
    });

    describe("Registration", async ()=> {
       it("should allow farmers to register", async ()=> {
          await agriMarketplace.connect(farmer).Registration();
          const registeredFarmer = await agriMarketplace.farmers(farmer.address);
          expect(registeredFarmer.isRegistered).to.equal(true);
          expect(registeredFarmer.wallet).to.equal(farmer.address);
       });
    });

    describe("AddYourProduct", async()=>{
      it("should allow a registered farmers to add their product", async ()=> {
         await agriMarketplace.connect(farmer).Registration();

         const name = 'Rice';
         const id = 1;
         const quantity = 100;
         const price = ethers.parseUnits("120", 18);
         const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24; //1 DAY from now
         await agriMarketplace.connect(farmer).AddYourProduct(name,id,quantity,price,expiry);

         const product = await agriMarketplace.products(id);
         expect(product.name).to.equal(name);
         expect(product.id).to.equal(id);
         expect(product.quantity).to.equal(quantity);
         expect(product.price).to.equal(price);
         expect(product.expiryTime).to.equal(expiry);
      });
    });

    describe("QualityChecking", () => {
      it("should allow the government to set a verifier and the verifier to check product quality", async () => {
        // Farmer registers and adds a product
        await agriMarketplace.connect(farmer).Registration();
  
        const name = "Rice";
        const id = 1;
        const quantity = 100;
        const price = ethers.parseUnits("120", 18);
        const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 1 day from now
  
        await agriMarketplace.connect(farmer).AddYourProduct(name, id, quantity, price, expiry);
  
        // Government sets a verifier for the product
        await agriMarketplace.connect(government).setVerifier(id, verifier.address);
  
        // Verifier checks the product quality
        await agriMarketplace.connect(verifier).QualityChecking(id);
  
        const qualityCheck = await agriMarketplace.qualityChecks(id);
        expect(qualityCheck.verifier).to.equal(verifier.address);
        expect(qualityCheck.hasVerified).to.equal(true);
      });
    });

    describe("purchaseProduct", async ()=> {
       it("should allow a buyer to purchase a product", async ()=>{
         await agriMarketplace.connect(farmer).Registration();
         const name = "Rice";
         const id = 1;
         const quantity = 100;
         const price = ethers.parseUnits("120", 18);
         const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 1 day from now
   
         await agriMarketplace.connect(farmer).AddYourProduct(name, id, quantity, price, expiry);
   
         await agriMarketplace.connect(buyer).purchaseProduct(id, {value:price});
         const product = await agriMarketplace.products(id);
        expect(product.sold).to.equal(true);
      });
    });

    describe("checkProductExpiry", async ()=> {
      it("should check if a product has expired", async ()=> {
          await agriMarketplace.connect(farmer).Registration();

          const name = "wheat";
          const id = 2;
          const quality = 200;
          const price = ethers.parseUnits("100", 18);
          const expiry = Math.floor(Date.now()/1000) + 60 * 60 * 24;

          await agriMarketplace.connect(farmer).AddYourProduct(name,id,quality,price,expiry);

          // Wait 1 minute to let the product expire
          // If you want to simulate time passing in a more complex test environment, you'd need to use something like Hardhat's evm_increaseTime to fast-forward time.
          await ethers.provider.send("evm_increaseTime", [60*60*24*2]);
          await ethers.provider.send("evm_mine", []);
          const expired = await agriMarketplace.checkProductExpiry(id);
+
          expect(expired).to.equal(true); //product should now be expired
      });
    });
});