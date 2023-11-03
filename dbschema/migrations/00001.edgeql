CREATE MIGRATION m12kt5prams4ugt3oyglsm5l7pn6znxsmoi7kncm76qxy626xvouaa
    ONTO initial
{
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
  CREATE TYPE default::Customer {
      CREATE REQUIRED LINK identity: ext::auth::Identity;
      CREATE REQUIRED PROPERTY text: std::str;
  };
  CREATE GLOBAL default::current_customer := (std::assert_single((SELECT
      default::Customer
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
  CREATE TYPE default::Item {
      CREATE REQUIRED PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY sku: std::str;
  };
  CREATE TYPE default::Cart {
      CREATE REQUIRED LINK customer: default::Customer;
      CREATE ACCESS POLICY customer_has_full_access
          ALLOW ALL USING ((GLOBAL default::current_customer ?= .customer));
      CREATE MULTI LINK items: default::Item {
          CREATE PROPERTY quantity: std::int32;
      };
  };
};
