-- Bazinga Comics — initial MySQL schema.
-- On startup the application calls AppDbContext.Database.EnsureCreated() which
-- will create the schema from the EF Core model if the database is empty.
-- This script is kept as a reference / manual bootstrap equivalent to the
-- original Flyway V1 migration, plus the news_posts table and subscription
-- columns that were added via Hibernate DDL updates.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  date_of_birth DATE NULL,
  role VARCHAR(50) NULL,
  subscription_type VARCHAR(20) NULL DEFAULT 'Free',
  subscription_expiration DATE NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY ux_users_username (username),
  UNIQUE KEY ux_users_email (email)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  UNIQUE KEY ux_categories_name (name)
);

CREATE TABLE IF NOT EXISTS conditions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  condition_description VARCHAR(150) NOT NULL,
  UNIQUE KEY ux_conditions_description (condition_description)
);

CREATE TABLE IF NOT EXISTS comics (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NULL,
  isbn VARCHAR(30) NULL,
  description TEXT NULL,
  main_character VARCHAR(255) NULL,
  series VARCHAR(255) NULL,
  published_year INT NULL,
  condition_id BIGINT NULL,
  category_id BIGINT NULL,
  price DECIMAL(10,2) NULL,
  image VARCHAR(500) NULL,
  comic_type VARCHAR(20) NOT NULL DEFAULT 'PHYSICAL_COPY',
  redacted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY ux_comics_isbn (isbn),
  KEY ix_comics_category (category_id),
  KEY ix_comics_condition (condition_id),
  CONSTRAINT fk_comics_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_comics_condition FOREIGN KEY (condition_id) REFERENCES conditions(id)
);

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY ux_carts_user (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  comic_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  purchase_type VARCHAR(20) NOT NULL DEFAULT 'ORIGINAL',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  UNIQUE KEY ux_cart_items_unique (cart_id, comic_id, purchase_type),
  KEY ix_cart_items_comic (comic_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  wishlist_id BIGINT NOT NULL,
  comic_id BIGINT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_wishlist_items_unique (wishlist_id, comic_id),
  KEY ix_wishlist_items_comic (comic_id),
  CONSTRAINT fk_wishlist_items_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_items_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS libraries (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY ux_libraries_user (user_id),
  CONSTRAINT fk_libraries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_items (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  library_id BIGINT NOT NULL,
  comic_id BIGINT NOT NULL,
  added_at DATETIME NOT NULL,
  UNIQUE KEY ux_library_items_unique (library_id, comic_id),
  KEY ix_library_items_comic (comic_id),
  CONSTRAINT fk_library_items_library FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
  CONSTRAINT fk_library_items_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_amount DECIMAL(10,2) NULL,
  status VARCHAR(50) NULL,
  shipping_address VARCHAR(500) NULL,
  billing_address VARCHAR(500) NULL,
  order_date DATETIME NOT NULL,
  KEY ix_orders_user (user_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  comic_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NULL,
  review_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_reviews_user (user_id),
  KEY ix_reviews_comic (comic_id),
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_categories (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  UNIQUE KEY ux_report_categories_name (category_name)
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  report_text TEXT NULL,
  report_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id BIGINT NOT NULL,
  comic_id BIGINT NOT NULL,
  report_category_id BIGINT NOT NULL,
  KEY ix_reports_user (user_id),
  KEY ix_reports_comic (comic_id),
  KEY ix_reports_category (report_category_id),
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_category FOREIGN KEY (report_category_id) REFERENCES report_categories(id)
);

CREATE TABLE IF NOT EXISTS news_posts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  KEY ix_news_posts_expires (expires_at),
  CONSTRAINT fk_news_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
