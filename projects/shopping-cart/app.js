//Render Products
const shop = document.querySelector(".shop");
let renderShop = () => {
	products.forEach((product) => {
		return (shop.innerHTML += `
        <div class=" d-flex justify-content-evenly my-5">
                    <div class="card showcaseCards">
                        <img src="${product.image}"
                            class="card-img-top" alt="${product.name}">
                        <div class="card-body text-center">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                        </div>
                        <ul class="list-group list-group-flush text-center">
                            <li class="list-group-item">$${product.price}</li>
                            <li class="list-group-item"><button type="button" class="btn btn-info px-4">Add to cart</button>
                            </li>
                        </ul>
                    </div>
                </div>`);
	});
};
renderShop();
//
function updateTotal() {
	let cartContainer = document.querySelector(".cart-items");
	let cartRows = cartContainer.querySelectorAll(".cart-row");
	let total = 0;
	for (let i = 0; i < cartRows.length; i++) {
		let cartRow = cartRows[i];
		let priceEl = cartRow.querySelector(".priceInput");
		let quantityEl = cartRow.querySelectorAll(".quantityInput")[0];
		let price = parseFloat(priceEl.innerText.replace("$", ""));
		let quantity = quantityEl.value;
		total = `${parseFloat(total) + price * quantity}`;
	}
	document.querySelector("#totalPrice").innerText = `$${total}`;
}

function removeCartItem() {
	const removeCartBtns = document.querySelectorAll(".btn-danger");
	for (let i = 0; i < removeCartBtns.length; i++) {
		let button = removeCartBtns[i];
		button.addEventListener("click", (event) => {
			let buttonClicked = event.target;
			buttonClicked.parentElement.parentElement.parentElement.parentElement.remove();
			updateTotal();
		});
	}
}

function quantityChange() {
	let quantityInputs = document.querySelectorAll(".quantityInput");
	for (let i = 0; i < quantityInputs.length; i++) {
		let input = quantityInputs[i];
		input.addEventListener("change", () => {
			updateTotal();
		});
	}
}

const addToCart = document.querySelectorAll(".btn-info");
for (let i = 0; i < addToCart.length; i++) {
	let button = addToCart[i];
	button.addEventListener("click", () => {
		let cartContainer = document.querySelector(".cart-items");
		let generateCard = () => {
			product = products[i];
			return (cartContainer.innerHTML += `
				<div class="card rounded-3 mb-4 col cart-row">
                        <div class="card-body p-md-5">
                            <div class="row d-flex justify-content-between align-items-center">
                                <div class="col-md-3 col-lg-2 col-xl-2">
                                    <img src="${product.image}"
                                        class="img-fluid rounded-3" alt="${product.name}">
                                </div>
                                <div class="col-6 col-sm-8 col-md-3 col-lg-3 col-xl-3">
                                    <p class="lead fw-normal mb-2">${product.description}</p>
                                    <p><span class="text-muted">${product.name}</span></p>
                                </div>
                                <div class="col-3 col-sm-3 col-md-2 col-lg-1 col-xl-1 d-flex">


                                    <input class="quantityInput form-control text-center" min="1"
                                        value="1" type="number" />


                                </div>
                                <div
                                    class="col-6 col-sm-3 col-md-2 col-lg-2 col-xl-2 offset-6 offset-sm-9 offset-md-0 offset-lg-1 pb-0">
                                    <p class="fs-2 priceInput mb-0 text-end">$${product.price}</h5>
                                </div>
                                <div class="col-md-1 col-lg-1 col-xl-1 text-end ">
                                    <button class="btn btn-danger">Remove</button>
                                </div>
                            </div>
                        </div>
                    </div>`);
		};
		generateCard();
		removeCartItem();
		quantityChange();
		updateTotal();
	});
}

document
	.querySelector(".proceedToCheckout")
	.addEventListener("click", () => alert("Thank you for your purchase!"));
