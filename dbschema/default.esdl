using extension auth;

module default {
    global current_customer := (
        assert_single((
            select Customer
            filter .identity = global ext::auth::ClientTokenIdentity
        ))
    );

    type Customer {
        required text: str;
        required identity: ext::auth::Identity;
    }

    type Item {
        required sku: str;
        required description: str;
    }

    type Cart {
        required customer: Customer;
        multi items: Item {
            quantity: int32;
        };

        access policy customer_has_full_access
            allow all
            using (global current_customer ?= .customer);
    }
}
