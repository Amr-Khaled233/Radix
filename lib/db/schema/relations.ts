import { relations } from "drizzle-orm";
import { account, session, user } from "./auth";
import {
  categories,
  media,
  projectCategories,
  projectMedia,
  projectResults,
  projects,
  projectServices,
  projectTeam,
  services,
  teamMemberCategories,
  teamMembers,
} from "./content";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const categoryRelations = relations(categories, ({ many, one }) => ({
  services: many(services),
  projects: many(projectCategories),
  ogImage: one(media, { fields: [categories.ogImageId], references: [media.id] }),
}));

export const serviceRelations = relations(services, ({ one }) => ({
  category: one(categories, { fields: [services.categoryId], references: [categories.id] }),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  cover: one(media, { fields: [projects.coverImageId], references: [media.id] }),
  categories: many(projectCategories),
  services: many(projectServices),
  media: many(projectMedia),
  results: many(projectResults),
  team: many(projectTeam),
}));

export const projectCategoryRelations = relations(projectCategories, ({ one }) => ({
  project: one(projects, { fields: [projectCategories.projectId], references: [projects.id] }),
  category: one(categories, { fields: [projectCategories.categoryId], references: [categories.id] }),
}));

export const projectServiceRelations = relations(projectServices, ({ one }) => ({
  project: one(projects, { fields: [projectServices.projectId], references: [projects.id] }),
  service: one(services, { fields: [projectServices.serviceId], references: [services.id] }),
}));

export const projectMediaRelations = relations(projectMedia, ({ one }) => ({
  project: one(projects, { fields: [projectMedia.projectId], references: [projects.id] }),
  media: one(media, { fields: [projectMedia.mediaId], references: [media.id] }),
}));

export const projectResultRelations = relations(projectResults, ({ one }) => ({
  project: one(projects, { fields: [projectResults.projectId], references: [projects.id] }),
}));

export const projectTeamRelations = relations(projectTeam, ({ one }) => ({
  project: one(projects, { fields: [projectTeam.projectId], references: [projects.id] }),
  member: one(teamMembers, { fields: [projectTeam.teamMemberId], references: [teamMembers.id] }),
}));

export const teamMemberRelations = relations(teamMembers, ({ one, many }) => ({
  photo: one(media, { fields: [teamMembers.photoId], references: [media.id] }),
  categories: many(teamMemberCategories),
  projects: many(projectTeam),
}));

export const teamMemberCategoryRelations = relations(teamMemberCategories, ({ one }) => ({
  member: one(teamMembers, { fields: [teamMemberCategories.teamMemberId], references: [teamMembers.id] }),
  category: one(categories, { fields: [teamMemberCategories.categoryId], references: [categories.id] }),
}));
