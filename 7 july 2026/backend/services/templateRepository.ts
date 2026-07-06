import pool from "../service/dbConnection";

export async function saveTemplate(
    userId: string,
    template: any
) {
        const result = await pool.query(
            `INSERT INTO report_templates (user_id, template)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE
            SET
            template = EXCLUDED.template,
            updated_at = NOW();`, [userId, JSON.stringify(template)]);
}

export async function loadTemplate(userID:string){
    const result = await pool.query(
        `
        SELECT template
        FROM report_templates
        WHERE user_id = $1
        `, [userID]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0].template;
}