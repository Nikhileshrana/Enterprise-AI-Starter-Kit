import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/mongodb";

export type MemberRow = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string | null;
};

const SORT_FIELDS = new Set(["name", "email", "role", "createdAt"]);

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 },
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("pageSize") ?? "10") || 10),
  );
  const search = (searchParams.get("search") ?? "").trim();
  const sortByRaw = searchParams.get("sortBy") ?? "name";
  const sortBy = SORT_FIELDS.has(sortByRaw) ? sortByRaw : "name";
  const sortDir = searchParams.get("sortDir") === "desc" ? -1 : 1;

  const matchStage: Record<string, unknown> = { organizationId };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };
    matchStage.$or = [
      { "user.name": regex },
      { "user.email": regex },
      { role: regex },
    ];
  }

  const sortKey =
    sortBy === "name"
      ? "user.name"
      : sortBy === "email"
        ? "user.email"
        : sortBy;

  const pipeline = [
    { $match: { organizationId } },
    {
      $lookup: {
        from: "user",
        localField: "userId",
        foreignField: "id",
        as: "userDocs",
      },
    },
    {
      $addFields: {
        user: { $arrayElemAt: ["$userDocs", 0] },
      },
    },
    ...(search ? [{ $match: matchStage }] : []),
    {
      $facet: {
        meta: [{ $count: "total" }],
        rows: [
          { $sort: { [sortKey]: sortDir } },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 0,
              id: "$id",
              role: 1,
              userId: 1,
              name: { $ifNull: ["$user.name", ""] },
              email: { $ifNull: ["$user.email", ""] },
              image: { $ifNull: ["$user.image", null] },
              createdAt: {
                $cond: [
                  { $ifNull: ["$createdAt", false] },
                  { $toString: "$createdAt" },
                  null,
                ],
              },
            },
          },
        ],
      },
    },
  ];

  const [result] = await db
    .collection("member")
    .aggregate<{
      meta: { total: number }[];
      rows: MemberRow[];
    }>(pipeline)
    .toArray();

  const total = result?.meta[0]?.total ?? 0;
  const data = result?.rows ?? [];

  const org = await db
    .collection("organization")
    .findOne({ id: organizationId });

  const membership = await db.collection("member").findOne({
    organizationId,
    userId: session.user.id,
  });

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    organizationName: (org?.name as string | undefined) ?? "Organization",
    canManage: ["owner", "admin"].includes(
      (membership?.role as string | undefined) ?? "",
    ),
  });
}
