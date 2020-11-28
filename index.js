const Airtable = require("airtable");
var Slack = require("slack-node");
var fs = require("fs");
const axios = require("axios");
// [LIVE, DONE, WIP, PENDING];
const taskStatusMapper = {
  0: "LIVE",
  1: "DONE",
  2: "WIP",
  3: "PENDING",
};

const base = new Airtable({ apiKey: "keyYzBzzTtgE06jYp" }).base(
  "appgTTtMxqYdEumHB"
);

const webhookUri =
  "https://hooks.slack.com/services/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";

slack = new Slack();
slack.setWebhook(webhookUri);

const CreateJson = ({ task, owner, status }) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${task} \n ${owner.join("")}\n`,
      },
    },
  ];
};

(async () => {
  const WIP = [];
  const DONE = [];
  const LIVE = [];
  const PENDING = [];
  let task = null;
  base("Task")
    .select({
      view: "Grid view",
    })
    .firstPage(function (err, records) {
      if (err) {
        console.error(err);
        return;
      }
      records.forEach(function (record) {
        task = CreateJson({
          task: record.fields.Task,
          status: record.fields.Status,
          owner: record.fields.Assignee.map(({ name }) => name),
        });
        switch (record.fields.Status) {
          case "WIP":
            return WIP.push(task);
          case "DONE":
            return DONE.push(task);
          case "LIVE":
            return LIVE.push(task);
          case "PENDING":
            return PENDING.push(task);
          default:
            return;
        }
      });

      const result = [LIVE, DONE, WIP, PENDING];
      const output = [];
      result.map((el, index) => {
        output.push({
          type: "header",
          text: {
            type: "plain_text",
            text: taskStatusMapper[index],
            emoji: true,
          },
        });
        output.push({
          type: "divider",
        });
        el.forEach((el) => output.push(el));
      });
      const response = [].concat.apply([], output);

      axios
        .post(
          "https://hooks.slack.com/services/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",
          response
        )
        .then((res) => {
          console.log("SUCCESSFULLY POSTED");
        })
        .catch((err) => {
          console.log("SOMETHING WENT WRONG");
        });
      // fs.writeFile(
      //   "myjsonfile.json",
      //   JSON.stringify({ blocks: response }),
      //   "utf8",
      //   (res) => {}
      // );
    });
})();

// curl -X POST -H 'Content-type: application/json' --data '{"text":"Hello, World!"}'
// https://hooks.slack.com/services/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
