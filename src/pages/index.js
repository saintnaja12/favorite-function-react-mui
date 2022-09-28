import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import data from "../resource/data";
import { IconButton } from "@mui/material";
import TreeView from "@mui/lab/TreeView";
import TreeItem from "@mui/lab/TreeItem";
import CircleIcon from "@mui/icons-material/Circle";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CustomContent from "../components/TreeView";
import _ from "lodash";

const RenderTreeItem = ({ info, fn }) => {
  return (
    <div>
      <TreeItem
        ContentComponent={CustomContent}
        nodeId={info.permissionKey}
        label={
          <div className="flex justify-between items-center">
            {
              <div>
                <IconButton
                  onClick={() => fn.handleAddPermit(info)}
                  disabled={info.disabled}
                >
                  {_.some(fn.watch("permissions"), {
                    permissionKey: info.permissionKey,
                  }) ? (
                    <>
                      <CircleIcon color="primary" />
                    </>
                  ) : (
                    <>
                      <CircleOutlinedIcon
                        color={!info.disabled ? "inherit" : "inherit"}
                      />
                    </>
                  )}
                </IconButton>
              </div>
            }
            <div>
              <span>{info.permissionName}</span>
            </div>
          </div>
        }
        disabled={info.disabled}
      >
        {info.subtree &&
          info.subtree.map((root, i) => {
            return <RenderTreeItem key={i} info={root} fn={fn} />;
          })}
      </TreeItem>
    </div>
  );
};

const Page = () => {
  const { setValue, getValues, watch } = useForm({
    allowType: "Group",
  });
  const [expanded, setExpanded] = useState([]);
  const [abilities, setAbility] = useState([]);

  useEffect(() => {
    setAbility(data);
  }, []);

  const flatMapSubtrees = (m) => {
    const main = { ...m };
    if (!main.subtree || !main.subtree.length) {
      return main;
    }
    return [main, ..._.flatMapDeep(main.subtree, flatMapSubtrees)];
  };

  const handleAddPermit = (selected) => {
    if (selected.disabled) return;
    let array = getValues("permissions") || [];
    let arrayAbilities = abilities;

    let _splitSelected = selected.permissionKey.split(":");

    let arraySubTree = [];
    arrayAbilities.map((el, idx) => {
      el.subtree.map((elSub, idxSub) => {
        arraySubTree = _.flattenDeep([...arraySubTree, flatMapSubtrees(elSub)]);
      });
    });

    const filterCustom = (param, type) => {
      return param.filter((element, index) => {
        let _split = element.permissionKey.split(":");
        if (type === "root") return _.includes(_split, _splitSelected[0]);
        else if (type === "subRoot")
          return _.includes(_split, _splitSelected[1]);
      });
    };

    if (
      _.some(getValues("permissions"), {
        permissionKey: selected.permissionKey,
      })
    ) {
      if (_splitSelected.length === 1) {
        _.remove(array, (re) => {
          let _split = re.permissionKey.split(":");
          return _.includes(_split, selected.permissionKey);
        });
      }

      if (_splitSelected.length === 2 || _splitSelected.length === 3) {
        _.remove(array, (re, i) => {
          let _split = re.permissionKey.split(":");
          _split[2] = _split[0].concat(`:${_split[1]}:${_split[2]}`);
          _split[1] = _split[0].concat(`:${_split[1]}`);
          return _.includes(_split, selected.permissionKey);
        });
      }

      // Del Root after uncheck SubRoot all
      let countSubRoot = 0;
      getValues("permissions").map((el) => {
        let _split = el.permissionKey.split(":");
        if (_split.length > 1) countSubRoot = countSubRoot + 1;
      });

      if (countSubRoot > 0) {
        _.remove(array, (re) => {
          return _.isEqual(re.permissionKey, _splitSelected[0]);
        });
      }

      // Del SubRoot after uncheck child all
      let arraySubRoot = [];
      let countChild = 0;
      getValues("permissions").map((el) => {
        let _split = el.permissionKey.split(":");
        if (_split.length > 1) arraySubRoot.push(el);
      });
      arraySubRoot.map((el, i) => {
        let _split = el.permissionKey.split(":");
        if (_.includes(_split, _splitSelected[1])) countChild = countChild + 1;
      });

      if (countChild > 0) {
        _.remove(array, (re) => {
          return _.isEqual(
            re.permissionKey,
            `${_splitSelected[0]}:${_splitSelected[1]}`
          );
        });
      }

      setValue("permissions", array);
    } else {
      if (selected.subtree) {
        let resultTree = flatMapSubtrees(selected);
        setValue("permissions", [...array, ...resultTree]);
      } else {
        setValue("permissions", [...array, selected]);
      }

      // Add Root after check SubRoot all
      if (
        filterCustom(getValues("permissions"), "root").length ===
        filterCustom(arraySubTree, "root").length
      ) {
        arrayAbilities.map((el) => {
          if (_.includes(_splitSelected, el.permissionKey)) {
            let addRoot = getValues("permissions");
            addRoot.push(el);
            setValue("permissions", [...addRoot]);
          }
        });
      }

      // Add SubRoot after check child all
      if (
        filterCustom(getValues("permissions"), "subRoot").length ===
        filterCustom(
          arraySubTree.filter((el) => el.permissionKey.split(":").length > 2),
          "subRoot"
        ).length
      ) {
        arrayAbilities.map((el) => {
          if (_.includes(_splitSelected, el.permissionKey)) {
            _splitSelected[1] = _splitSelected[0].concat(
              `:${_splitSelected[1]}`
            );
            el.subtree.map((elm) => {
              if (_.includes(_splitSelected, elm.permissionKey)) {
                let addSubRoot = getValues("permissions");
                addSubRoot.push(elm);
                setValue("permissions", [...addSubRoot]);
              }
            });
          }
        });
      }

      let _uniqBy = _.uniqBy(getValues("permissions"), (e) => {
        return e.permissionKey;
      });
      _uniqBy.map((el) => delete el.subtree);
      setValue("permissions", [..._uniqBy]);
    }
  };

  return (
    <>
      {/* {data.map((el) => (
        <>
          <pre>{`${el.permissionName}`}</pre>

          {el.subtree.map((elm) => (
            <pre>{elm.permissionName}</pre>
          ))}
        </>
      ))} */}

      <div className="grid grid-cols-6 gap-1">
        <div className="col-span-6 lg:col-span-3">
          <div class=" rounded shadow-lg">
            <div class="px-6 py-4">
              <div class="font-bold text-xl mb-2">Tree View</div>
              <TreeView
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                expanded={expanded}
                onNodeToggle={(event, nodeIds) => setExpanded(nodeIds)}
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  width: "100%",
                  minHeight: "50vh",
                  maxHeight: "80vh",
                  height: "100%",
                }}
              >
                {abilities.map((root, i) => {
                  return (
                    <RenderTreeItem
                      key={i}
                      info={root}
                      fn={{ handleAddPermit, watch, getValues }}
                    />
                  );
                })}
              </TreeView>
            </div>
          </div>
        </div>
        <div className="col-span-6 lg:col-span-3">
          <div class=" rounded shadow-lg">
            <div class="px-6 py-4">
              <div class="font-bold text-xl mb-2">Selected Data</div>
              <div>
                <pre>{JSON.stringify(getValues("permissions"), null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
