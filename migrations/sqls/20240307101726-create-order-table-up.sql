/* Replace with your SQL commands */

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  amount INTEGER NOT NULL,

  CONSTRAINT fk_accounts FOREIGN KEY(user_id) REFERENCES accounts(id)
);

CREATE TABLE order_item (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  item_price INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_items FOREIGN KEY(item_id) REFERENCES items(id),
  CONSTRAINT fk_orders FOREIGN KEY(order_id) REFERENCES orders(id)
);