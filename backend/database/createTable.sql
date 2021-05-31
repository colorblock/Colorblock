create table if not exists user (
    `id` varchar(64),
    `address` varchar(64),
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
    `tags` varchar(500),
    `description` varchar(1000),
    `creator` varchar(64) comment 'the initial creator of item',
    `supply` integer comment 'the initial supply of item',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists ledger (
    `id` varchar(128) comment 'item_id:user_id format',
    `item_id` varchar(32) comment 'item id',
    `user_id` varchar(64) comment 'user id',
    `balance` varchar(64) comment 'balance of item',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists deal (
    `id` varchar(32) comment 'item_id:user_id format',
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
    `hash` varchar(64),
    `chain_id` integer,
    `block_height` integer,
    `block_time` DATETIME,
    `verified` boolean,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`hash`)
);

