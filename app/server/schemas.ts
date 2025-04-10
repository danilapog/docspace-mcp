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
