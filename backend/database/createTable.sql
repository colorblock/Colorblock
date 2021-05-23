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
    `id` varchar(32),
    `title` varchar(64),
    `tags` varchar(64),
    `description` varchar(1000),
    `creator` varchar(64),
    `owner` varchar(64),
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (`id`)
);
