/**
 * (c) Copyright Ascensio System SIA 2025
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 */

/* eslint-disable no-underscore-dangle */

import * as z from "zod"

export const RoomInvitationAccessSchema = z.union([
	z.literal(0).describe("None. No access to the room."),
	z.literal(2).describe("Viewer. File viewing."),
	z.literal(5).describe("Reviewer. Operations with existing files: viewing, reviewing, commenting."),
	z.literal(6).describe("Commenter. Operations with existing files: viewing, commenting."),
	z.literal(7).describe("Form filler. Form fillers can fill out forms and view only their completed/started forms within the Complete and In Process folders."),
	z.literal(9).describe("Room manager (Paid). Room managers can manage the assigned rooms, invite new users and assign roles below their level."),
	z.literal(10).describe("Editor. Operations with existing files: viewing, editing, form filling, reviewing, commenting."),
	z.literal(11).describe("Content creator. Content creators can create and edit files in the room, but can't manage users, or access settings."),
])

export const FormFillingRoomInvitationAccessSchema = z.union([
	RoomInvitationAccessSchema._def.options[4],
	RoomInvitationAccessSchema._def.options[5],
	RoomInvitationAccessSchema._def.options[7],
])

export const CollaborationRoomInvitationAccessSchema = z.union([
	RoomInvitationAccessSchema._def.options[1],
	RoomInvitationAccessSchema._def.options[5],
	RoomInvitationAccessSchema._def.options[6],
	RoomInvitationAccessSchema._def.options[7],
])

export const CustomRoomInvitationAccessSchema = z.union([
	RoomInvitationAccessSchema._def.options[1],
	RoomInvitationAccessSchema._def.options[2],
	RoomInvitationAccessSchema._def.options[3],
	RoomInvitationAccessSchema._def.options[5],
	RoomInvitationAccessSchema._def.options[6],
	RoomInvitationAccessSchema._def.options[7],
])

export const PublicRoomInvitationAccessSchema = z.union([
	RoomInvitationAccessSchema._def.options[5],
	RoomInvitationAccessSchema._def.options[7],
])

export const VirtualDataRoomInvitationAccessSchema = z.union([
	RoomInvitationAccessSchema._def.options[1],
	RoomInvitationAccessSchema._def.options[4],
	RoomInvitationAccessSchema._def.options[5],
	RoomInvitationAccessSchema._def.options[6],
	RoomInvitationAccessSchema._def.options[7],
])
