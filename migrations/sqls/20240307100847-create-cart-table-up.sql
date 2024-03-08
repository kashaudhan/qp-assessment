/* Replace with your SQL commands */

CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT fk_accounts FOREIGN KEY(user_id) REFERENCES accounts(id),
  CONSTRAINT fk_items FOREIGN KEY(item_id) REFERENCES items(id)
);
