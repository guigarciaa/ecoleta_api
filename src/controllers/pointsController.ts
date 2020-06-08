import express from "express";
import knex from "../database/connection";

export default class PointsController {
  async index(req: express.Request, res: express.Response) {
    try {
      const { city, uf, itens } = req.query;

      const parsedItens = String(itens)
        .split(",")
        .map((item) => Number(item.trim()));

      const points = await knex("points")
        .join("point_itens", "points.id", "=", "point_itens.point_id")
        .whereIn("point_itens.item_id", parsedItens)
        .where("city", String(city))
        .where("uf", String(uf))
        .distinct()
        .select("points.*");

      const serializedPoints = points.map((point) => {
        return {
          ...point,
          image_url: `http://192.168.0.109:3333/uploads/${point.image}`,
        };
      });

      return res.status(200).json(serializedPoints);
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  async show(req: express.Request, res: express.Response) {
    try {
      const { id } = req.params;
      const point = await knex("points").where("id", id).first();

      if (!point) return res.status(400).json({ message: "Point not found." });


      const serializedItens = {
        ...point,
        image_url: `http://192.168.0.109:3333/uploads/${point.image}`,
      };

      const items = await knex("itens")
        .join("point_itens", "itens.id", "=", "point_itens.item_id")
        .where("point_itens.point_id", id)
        .select("itens.title");
  

      return res.status(200).json({ point: serializedItens, items });
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  async create(req: express.Request, res: express.Response) {
    try {
      const {
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
        itens,
      } = req.body;

      const trx = await knex.transaction();

      const point = {
        image: req.file.filename,
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
      };
      const insertedIds = await trx("points").insert(point);

      const point_id = insertedIds[0];

      const pointItems = itens
        .split(",")
        .map((item: string) => Number(item.trim()))
        .map((item_id: number) => {
          return {
            item_id,
            point_id,
          };
        });

      await trx("point_itens").insert(pointItems);

      await trx.commit();

      return res.status(200).json({
        id: point_id,
        ...point,
      });
    } catch (e) {
      return res.status(500).json(e);
    }
  }
}
