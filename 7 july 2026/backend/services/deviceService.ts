import pool from "../service/dbConnection";

export async function getDevices(userId: string) {
    const result = await pool.query(
        `
        SELECT
            device_id,
            name
        FROM devices
        WHERE user_id = $1
        ORDER BY name;
        `,
        [userId]
    );

    return result.rows;
}