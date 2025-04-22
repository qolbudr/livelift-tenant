-- DropForeignKey
ALTER TABLE `history` DROP FOREIGN KEY `History_liveId_fkey`;

-- DropForeignKey
ALTER TABLE `Live` DROP FOREIGN KEY `Live_videoId_fkey`;

-- DropIndex
DROP INDEX `History_liveId_fkey` ON `history`;

-- DropIndex
DROP INDEX `Live_videoId_fkey` ON `live`;

-- AddForeignKey
ALTER TABLE `Live` ADD CONSTRAINT `Live_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `Video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `History` ADD CONSTRAINT `History_liveId_fkey` FOREIGN KEY (`liveId`) REFERENCES `Live`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
