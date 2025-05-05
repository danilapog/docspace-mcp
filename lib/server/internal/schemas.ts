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

import * as z from "zod"

export const SortedByTypeSchema = z.union([
	z.literal("DateAndTime"),
	z.literal("AZ"),
	z.literal("Size"),
	z.literal("Author"),
	z.literal("Type"),
	z.literal("New"),
	z.literal("DateAndTimeCreation"),
	z.literal("RoomType"),
	z.literal("Tags"),
	z.literal("Room"),
	z.literal("CustomOrder"),
	z.literal("LastOpened"),
	z.literal("UsedSpace"),
])

export const SortOderSchema = z.union([
	z.literal("ascending"),
	z.literal("descending"),
])

export const FilterOpSchema = z.union([
	z.literal("contains"),
	z.literal("equals"),
	z.literal("startsWith"),
	z.literal("present"),
])

export const FiltersSchema = z.object({
	count: z.number().optional().describe("The number of items to return."),
	startIndex: z.number().optional().describe("The number of items to skip before starting to return items."),
	sortBy: z.union([SortedByTypeSchema, z.string()]).optional().describe("The field to sort by."),
	sortOrder: SortOderSchema.optional().describe("The order to sort by."),
	filterBy: z.string().optional().describe("The field to filter by."),
	filterOp: FilterOpSchema.optional().describe("The operation to use for filtering."),
	filterValue: z.string().optional().describe("The value to filter by."),
	updatedSince: z.string().optional().describe("The date to filter items updated or created since."),
})
