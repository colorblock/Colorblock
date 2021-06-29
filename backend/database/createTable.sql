-- Database: colorblock

create table if not exists user (
    `id` varchar(64),
    `address` varchar(64),
    `public_key` varchar(64),
    `uname` varchar(64),
    `avatar` varchar(32),
    `profile` varchar(1000),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists item (
    `id` varchar(32) comment 'hash id from colors',
    `title` varchar(64) comment 'token title, fixed',
    `type` integer comment 'type of image, 0: static, 1: animated',
    `tags` varchar(64),
    `description` varchar(1000),
    `creator` varchar(64) comment 'the initial creator of item',
    `supply` integer comment 'the initial supply of item',
    `urls` varchar(300),
    `verifier` varchar(64),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists asset (
    `id` varchar(128),
    `item_id` varchar(32),
    `user_id` varchar(64),
    `balance` integer,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists collection (
    `id` varchar(64),
    `user_id` varchar(64),
    `title` varchar(64),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists collectible (
    `id` varchar(64),
    `item_id` varchar(64),
    `collection_id` varchar(64),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists deal (
    `id` varchar(128) comment 'item_id:user_id format',
    `item_id` varchar(32) comment 'item id',
    `user_id` varchar(64) comment 'user id',
    `price` decimal(22, 12) comment 'sale price',
    `total` integer comment 'total sale amount',
    `remain` integer comment 'remain sale amount',
    `open` boolean comment 'open status',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists block (
    `id` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_hash` varchar(64),
    `block_time` DATETIME,
    `relevant` boolean comment 'relevant to colorblock tx',
    `verified` boolean comment 'data recording is finished',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists transfer (
    `id` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_hash` varchar(64),
    `block_time` DATETIME,
    `tx_id` integer,
    `tx_hash` varchar(64),
    `tx_status` varchar(64),
    `item_id` varchar(64),
    `sender` varchar(64),
    `receiver` varchar(64),
    `amount` integer,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists mint (
    `id` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_hash` varchar(64),
    `block_time` DATETIME,
    `tx_id` integer,
    `tx_hash` varchar(64),
    `tx_status` varchar(64),
    `item_id` varchar(64),
    `user_id` varchar(64),
    `supply` integer,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists `release` (
    `id` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_hash` varchar(64),
    `block_time` DATETIME,
    `tx_id` integer,
    `tx_hash` varchar(64),
    `tx_status` varchar(64),
    `item_id` varchar(64),
    `seller` varchar(64),
    `price` decimal(20, 12),
    `amount` integer,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists recall (
    `id` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_hash` varchar(64),
    `block_time` DATETIME,
    `tx_id` integer,
    `tx_hash` varchar(64),
    `tx_status` varchar(64),
    `item_id` varchar(64),
    `seller` varchar(64),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists purchase (
    `id` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_hash` varchar(64),
    `block_time` DATETIME,
    `tx_id` integer,
    `tx_hash` varchar(64),
    `tx_status` varchar(64),
    `item_id` varchar(64),
    `buyer` varchar(64),
    `seller` varchar(64),
    `price` decimal(20, 12),
    `amount` integer,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists project (
    `id` varchar(64),
    `user_id` varchar(64),
    `title` varchar(64),
    `frames` text,
    `palette` text,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists sale (
    `id` varchar(64),
    `item_id` varchar(64),
    `user_id` varchar(64),
    `price` decimal(22, 12),
    `total` integer,
    `remaining` integer,
    `status` varchar(64),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);