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
    `tx_id` varchar(128) comment 'the creation tx hash',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists ledger (
    `id` varchar(128) comment 'item_id:user_id format',
    `item_id` varchar(32) comment 'item id',
    `user_id` varchar(64) comment 'user id',
    `balance` varchar(64) comment 'balance of item',
    `tx_id` varchar(128) comment 'the creation tx hash',
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
    `tx_id` varchar(128) comment 'the creation tx hash',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

create table if not exists purchase (
    `id` varchar(64) comment 'unique hash of purchase',
    `item_id` varchar(32) comment 'item id',
    `buyer_id` varchar(64) comment 'buyer id',
    `seller_id` varchar(64) comment 'buyer id',
    `price` decimal(22, 12) comment 'sale price',
    `amount` integer comment 'purchase amount',
    `tx_id` varchar(128) comment 'the creation tx hash',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);

