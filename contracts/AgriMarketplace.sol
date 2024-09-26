// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract AgriMarketplace {
    address payable public Government;
    uint public MSP;
    uint public ProductCounter;

    struct Farmer {
        address payable wallet;
        uint[] products;
        bool isRegistered;
    }

    struct Buyer {
        address wallet;
        uint[] purchaseProducts;
    }

    struct Product {
        string name;
        uint id;
        uint quantity;
        uint price;
        uint expiryTime;
        address payable farmer;
        bool sold;
    }

    struct qualityVerifier {
        address verifier;
        bool hasVerified;
    }

    mapping(address => Farmer) public farmers;
    mapping(address => Buyer) public buyers;
    mapping(uint => Product) public products;
    mapping(string => uint) public MSPforProduct;
    mapping(uint => qualityVerifier) public qualityChecks;

    modifier onlyGovernment() {
        require(msg.sender == Government, "only Government can decide");
        _;
    }

    modifier onlyFarmer() {
        require(farmers[msg.sender].isRegistered, "you are not farmer");
        _;
    }

    event MSPUpdated(uint MSP);
    event farmerRegistered(address indexed farmer);
    event productAdded(uint productId, address indexed farmer, string name, uint quantity, uint price);
    event productPurchased(uint productId, address indexed buyer, uint quantity, uint price);

    constructor() {
        Government = payable(msg.sender);
    }

    function MSPUpdate(string memory product, uint newMSP) public onlyGovernment {
        MSP = newMSP;
        MSPforProduct[product] = newMSP;
        emit MSPUpdated(newMSP);
    }

    function Registration() public {
        require(!farmers[msg.sender].isRegistered, "already registered");
        farmers[msg.sender].wallet = payable(msg.sender);
        farmers[msg.sender].isRegistered = true;

        emit farmerRegistered(msg.sender);
    }

    function AddYourProduct(string calldata name_, uint id_, uint quantity_, uint price_, uint expiry_) public onlyFarmer {
        require(price_ >= MSP, "price must be equal to MSP or greater");
        ProductCounter++;
        products[id_] = Product(name_, id_, quantity_, price_, expiry_, payable(msg.sender), false);

        farmers[msg.sender].wallet = payable(msg.sender);
        farmers[msg.sender].products.push(ProductCounter);
        emit productAdded(id_, msg.sender, name_, quantity_, price_);
    }

    function setVerifier(uint productId, address verifierAddress) public onlyGovernment {
        require(products[productId].farmer != address(0), "Product does not exist");
        qualityChecks[productId] = qualityVerifier(verifierAddress, false);
    }

    function QualityChecking(uint id_) public {
        require(msg.sender == qualityChecks[id_].verifier, "only quality professional can verify");
        qualityChecks[id_].hasVerified = true;
    }

    function purchaseProduct(uint id_) public payable {
        Product storage product = products[id_];
        require(!product.sold, "already sold");
        require(msg.value >= product.price, "invalid amount");

        product.farmer.transfer(msg.value);
        product.sold = true;

        buyers[msg.sender].wallet = msg.sender;
        buyers[msg.sender].purchaseProducts.push(id_);

        emit productPurchased(id_, msg.sender, product.quantity, product.price);
    }

    function getFarmersProduct(address farmer_) view public returns (uint[] memory) {
        return farmers[farmer_].products;
    }

    function getBuyersProduct(address buyer_) view public returns (uint[] memory) {
        return farmers[buyer_].products;
    }

    function checkProductExpiry(uint id_) public view returns (bool) {
        return block.timestamp > products[id_].expiryTime;
    }

}
