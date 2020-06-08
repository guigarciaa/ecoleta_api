import express from "express";
import knex from "../database/connection";

export default class ItensController {
  async index(_: express.Request, res: express.Response) {
    try {
      const items = await knex("itens").select("*");
      const serializedItens = items.map((item) => {
        return {
          id: item.id,
          title: item.title,
          image_url: `http://192.168.0.109:3333/uploads/${item.image}`,
        };
      });
      res.status(200).json(serializedItens);
    } catch (e) {
      res.status(500).json(e);
    }
  }
}
